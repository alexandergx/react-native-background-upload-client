declare module "react-native-background-upload" {
    import type { EventSubscription, } from 'react-native'
    import type { MultipartUploadOptions, UploadLinkOptions, UploadListenerEvent, } from './src'

    export interface EventData { id: string, }

    export interface ProgressData extends EventData { progress: number, }

    export interface ErrorData extends EventData { error: string, }

    export interface CompletedData extends EventData { responseCode: number, responseBody: string, }

    export type FileInfo = {
        name: string
        exists: boolean
        size?: number
        extension?: string
        mimeType?: string
    }

    export default class Upload {
        static createUploadLink(options: UploadLinkOptions)
        static startUpload(options: UploadOptions | MultipartUploadOptions): Promise<string>
        static addListener(event: UploadListenerEvent.Progress, string: string | null, callback: (data: ProgressData ) => void): EventSubscription
        static addListener(event: UploadListenerEvent.Error, string: string | null, callback: (data: ErrorData) => void): EventSubscription
        static addListener(event: UploadListenerEvent.Cancelled, string: string | null, callback: (data: EventData) => void): EventSubscription
        static addListener(event: UploadListenerEvent.Completed, string: string | null, callback: (data: CompletedData) => void): EventSubscription
        static getFileInfo(path: string): Promise<FileInfo>
        static cancelUpload(string: string): Promise<boolean>
        static canSuspendIfBackground(): void
        static getRemainingBgTime(): Promise<number>
        static beginBackgroundTask(): Promise<number | null>
        static endBackgroundTask(id: number): void
    }

    export const createUploadLink: typeof Upload.createUploadLink
}
