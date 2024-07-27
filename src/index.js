// @flow
/**
 * Handles HTTP graphql background file uploads from an iOS device.
 */
import {Platform, NativeModules, NativeEventEmitter} from 'react-native';
import { ApolloLink, FetchResult, Observable, } from '@apollo/client/core';
import { selectHttpOptionsAndBody, fallbackHttpConfig, } from '@apollo/client/link/http';
import { print, } from 'graphql/language/printer';
import { extractFiles, isExtractableFile, } from 'extract-files';
import { MultipartUploadOptions, NotificationOptions } from 'react-native-background-apollo-upload-client';

export type UploadEvent =
  | 'progress'
  | 'error'
  | 'completed'
  | 'cancelled'
  | 'bgExpired';

export type NotificationArgs = {
  enabled: boolean,
};

export type StartUploadArgs = {
  url: string,
  path?: string,
  method?: 'PUT' | 'POST' | 'GET' | 'PATCH' | 'DELETE',
  // Optional, because raw is default
  type?: 'raw' | 'multipart',
  // This option is needed for multipart type
  field?: string,
  customUploadId?: string,
  // parameters are supported only in multipart type
  parameters?: {[key: string]: string},
  headers?: Object,
  notification?: Partial<NotificationOptions>,
};

const NativeModule = NativeModules.RNGraphqlFileUploader;
const eventPrefix = 'RNGraphqlFileUploader-';

const eventEmitter = new NativeEventEmitter(NativeModule);

/*
Gets file information for the path specified.
Example valid path is:
  iOS: 'file:///var/mobile/Containers/Data/Application/3C8A0EFB-A316-45C0-A30A-761BF8CCF2F8/tmp/trim.A5F76017-14E9-4890-907E-36A045AF9436.MOV;

Returns an object:
  If the file exists: {extension: "mp4", size: "3804316", exists: true, mimeType: "video/mp4", name: "20161116_074726.mp4"}
  If the file doesn't exist: {exists: false} and might possibly include name or extension

The promise should never be rejected.
*/
export const getFileInfo = async (path: string): Promise<Object> => {
  return NativeModule.getFileInfo(path).then((data: any) => {
    if (data.size) {
      // size comes back as a string on android so we convert it here.  if it's already a number this won't hurt anything
      data.size = +data.size;
    }
    return data;
  });
};

/*
Starts uploading a file to an HTTP endpoint.
Options object:
{
  url: string.  url to post to.
  path: string.  path to the file on the device none for no file
  headers: hash of name/value header pairs
  method: HTTP method to use.  Default is "POST"
  notification: hash for customizing tray notifiaction
    enabled: boolean to enable/disabled notifications, true by default.
}

Returns a promise with the string ID of the upload.  Will reject if there is a connection problem, the file doesn't exist, or there is some other problem.

It is recommended to add listeners in the .then of this promise.
*/
export const startUpload = (options: StartUploadArgs): Promise<string> =>
  NativeModule.startUpload(options);

/*
Cancels active upload by string ID of the upload.

Upload ID is returned in a promise after a call to startUpload method,
use it to cancel started upload.

Event "cancelled" will be fired when upload is cancelled.

Returns a promise with boolean true if operation was successfully completed.
Will reject if there was an internal error or ID format is invalid.
*/
export const cancelUpload = (cancelUploadId: string): Promise<boolean> => {
  if (typeof cancelUploadId !== 'string') {
    return Promise.reject(new Error('Upload ID must be a string'));
  }
  return NativeModule.cancelUpload(cancelUploadId);
};

/*
Listens for the given event on the given upload ID (resolved from startUpload).
If you don't supply a value for uploadId, the event will fire for all uploads.
Events (id is always the upload ID):
  progress - { id: string, progress: int (0-100) }
  error - { id: string, error: string }
  cancelled - { id: string, error: string }
  completed - { id: string }
*/
export const addListener = (
  eventType: UploadEvent,
  uploadId: string,
  listener: Function,
) => {
  return eventEmitter.addListener(eventPrefix + eventType, (data) => {
    if (!uploadId || !data || !data.id || data.id === uploadId) {
      listener(data);
    }
  });
};

// call this to let the OS it can suspend again
// it will be called after a short timeout if it isn't called at all
export const canSuspendIfBackground = () => {
  if (Platform.OS === 'ios') {
    NativeModule.canSuspendIfBackground();
  }
};

// returns remaining background time in seconds
export const getRemainingBgTime = (): Promise<number> => {
  if (Platform.OS === 'ios') {
    return NativeModule.getRemainingBgTime();
  }
  return Promise.resolve(10 * 60 * 24); // dummy for android, large number
};

// marks the beginning of a background task and returns its ID
// in order to request extra background time
// do not call more than once without calling endBackgroundTask
// useful if we need to do more background processing in addition to network requests
// canSuspendIfBackground should still be called in case we run out of time.
export const beginBackgroundTask = (): Promise<number | null> => {
  if (Platform.OS === 'ios') {
    return NativeModule.beginBackgroundTask();
  }
  return Promise.resolve(null); // dummy for android
};

// marks the end of background task using the id returned by begin
// failing to call this might end up on app termination
export const endBackgroundTask = (id: number) => {
  if (Platform.OS === 'ios') {
    NativeModule.endBackgroundTask(id);
  }
};

export interface UploadLinkOptions {
  uri: string,
  isExtractableFile?: (file: any) => boolean,
  includeExtensions?: boolean,
  headers?: Record<string, string>,
};

export interface UploadCallbacks {
  onError?: (e: any) => void,
  onCancelled?: (e: any) => void,
  onProgress?: (e: any) => void,
  onCompleted?: (e: any) => void,
};

export interface ExtendedContext {
  headers: { 'access-token': string | null | undefined, }
  callbacks?: UploadCallbacks,
};

const createUploadPromise = async (options: MultipartUploadOptions, callbacks?: UploadCallbacks) => {
  const uploadId = await startUpload(options)
  return new Promise((resolve, reject) => {
    const errorHandler = (data: any) => {
      cancelUpload(uploadId) // TODO - handle retries, edgecases?
      reject(data.error)
      callbacks?.onError?.(data.error)
    }
    addListener('error', uploadId, errorHandler)
    addListener('cancelled', uploadId, errorHandler)
    addListener('progress', uploadId, (progress: number) => {
      callbacks?.onProgress?.(progress)
    })
    addListener('completed', uploadId, (data: any) => {
      resolve(JSON.parse(data.responseBody))
      callbacks?.onCompleted?.(data)
    })
  })
}

/*
Replaces Apollo createUploadLink
*/
export const createUploadLink: (options: UploadLinkOptions) => ApolloLink = ({
  uri,
  isExtractableFile: customIsExtractableFile = isExtractableFile,
  includeExtensions = false,
}) => {
  try {
    return new ApolloLink((operation) => {
      const { headers } = operation.getContext()
      const context = operation.getContext()
      const {
        clientAwareness: { name = null, version = null, } = {},
        headers: contextHeaders,
        callbacks,
      } = context
      const contextConfig = {
        http: context.http,
        options: context.fetchOptions,
        credentials: context.credentials,
        headers: {
          ...context.headers,
          ...(name && { 'apollographql-client-name': name }),
          ...(version && { 'apollographql-client-version': version }),
          ...contextHeaders,
        },
      }
      const { body } = selectHttpOptionsAndBody(
        operation,
        fallbackHttpConfig,
        { http: { includeExtensions }, options: { uri }, },
        contextConfig
      )
      const { files } = extractFiles(body, '', (file: any): file is any => {
        return customIsExtractableFile(file)
      })
      const operations = {
        query: print(operation.query),
        variables: operation.variables,
        operationName: operation.operationName,
      }
      const map: Record<string, any[]> = {}
      const parts: Array<{ name: string, filename: string, data: any, }> = []
      let i = 0
      files.forEach((paths: any, file: any) => {
        const key = `${i}`
        map[key] = paths
        parts.push({ name: `${i}`, filename: `file`, data: file, })
        i++
      })
      const combinedHeaders = { ...headers, ...contextConfig.headers, }
      if (parts.length === 0) {
        return new Observable<FetchResult>((observer) => {
          fetch(uri, {
            method: 'POST',
            headers: { ...combinedHeaders, 'Content-Type': 'application/json', },
            body: JSON.stringify(body),
          })
            .then((response: any) => {
              if (!response.ok) return response.text().then((e: any) => { throw new Error(e) })
              return response.json()
            })
            .then(data => {
              observer.next(data)
              observer.complete()
            })
            .catch(observer.error.bind(observer))
        })
      } else {
        return new Observable<FetchResult>((observer) => {
          const promises = parts.map((part) => {
            const specificMap = { [part.name]: map[part.name] }
            const options: MultipartUploadOptions = {
              headers: { ...combinedHeaders, },
              parameters: { operations: JSON.stringify(operations), map: JSON.stringify(specificMap), },
              url: uri,
              type: 'multipart',
              method: 'POST',
              field: part.name,
              path: part.data.uri,
            }
            return createUploadPromise(options, callbacks)
          })
          Promise.all(promises)
            .then((results) => {
              results.forEach((result) => observer.next(result as FetchResult))
              observer.complete()
              canSuspendIfBackground()
            })
            .catch(observer.error.bind(observer))
        })
      }
    })
  } catch(e: any) {
    console.log('[REACT-NATIVE-GRAPHQL-BACKGROUND-UPLOAD ERROR] ', e)
    throw new Error(e)
  }
}

export default {
  startUpload,
  cancelUpload,
  addListener,
  getFileInfo,
  canSuspendIfBackground,
  getRemainingBgTime,
  beginBackgroundTask,
  endBackgroundTask,
  createUploadLink,
};
