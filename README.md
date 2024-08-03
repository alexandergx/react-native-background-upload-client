# react-native-background-upload-client
Handle multipart file uploads to your GraphQL server from your React Native app with Apollo.

Currently only supports iOS.

(Forked from "react-native-background-upload")

# Installation

## 1. Install package

`npm install --save react-native-background-upload-client`

## 2. Link Native Code

### Autolinking (React Native >= 0.60)

##### iOS

`cd ./ios && pod install && cd ../`

### Automatic Native Library Linking (React Native < 0.60)

`react-native link react-native-background-upload-client`

### Or, Manually Link It

#### iOS

1. In the XCode's "Project navigator", right click on your project's Libraries folder ➜ `Add Files to <...>`
2. Go to `node_modules` ➜ `react-native-background-upload-client` ➜ `ios` ➜ select `RNGraphqlFileUploader.xcodeproj`
3. Add `RNGraphqlFileUploader.a` to `Build Phases -> Link Binary With Libraries`

## 3. Expo

To use this library with [Expo](https://expo.io) one must first detach (eject) the project and follow [step 2](#2-link-native-code) instructions. Additionally on iOS there is a must to add a Header Search Path to other dependencies which are managed using Pods. To do so one has to add `$(SRCROOT)/../../../ios/Pods/Headers/Public` to Header Search Path in `RNGraphqlFileUploader` module using XCode.

# Usage

```js

// Simply remove the standard apollo createUploadLink...
import { createUploadLink, } from 'apollo-upload-client'

// ... and replace it with this!
import { createUploadLink, } from 'react-native-background-upload-client'

```

# Setting up Apollo Client for File Uploads

This section provides an in-depth example of setting up the Apollo Client and using `react-native-background-upload-client` to upload a file to your GraphQL server from your React Native app. Ensure you have these additional npm packages installed:

`npm install @apollo/client apollo-upload-client`

```js

import { createUploadLink, } from 'react-native-background-upload-client'
import { ApolloClient, InMemoryCache, useMutation, gql, } from '@apollo/client'
import { ReactNativeFile, } from 'apollo-upload-client'

// Define your GraphQL server URL
const serverUrl = 'https://your-server-url/graphql'

// Initialize the Apollo Client
const apolloClient = new ApolloClient({
  link: createUploadLink({ uri: serverUrl, }),
  cache: new InMemoryCache(),
})

function MyReactComponent() {
  // Define and use your GraphQL mutation within a functional component
  const [uploadFile] = useMutation(gql`
    mutation($file: Upload) {
      uploadFile(input: { file: $file })
    }
  `)

  // Upload the file to your server within an asynchronous function
  const handleUpload = async () => {
    const response = await uploadFile({
      variables: {
        file: new ReactNativeFile({ uri: 'path-to-file', name: 'file', }),
      },
    })
  }

  return (
    // UI components here
  )
}

```
