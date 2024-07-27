# react-native-background-upload-client
Handle multipart file uploads to your Graphql server from your React Native app with Apollo.

Currently only supports iOS.

(Forked from "react-native-background-upload")

# Installation

## 1. Install package

`npm install --save react-native-background-upload-client`

or

`yarn add react-native-background-upload-client`

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

This section provides an in-depth example of setting up the Apollo Client and using `react-native-background-upload-client` to upload a file to your Graphql server from your React Native app. Ensure you have these additional npm packages installed:

`npm install @apollo/client apollo-upload-client graphql graphql-ws`

```js

import { createUploadLink, } from 'react-native-background-upload-client'
import { ApolloClient, InMemoryCache, split, gql, } from '@apollo/client'
import { GraphQLWsLink, } from '@apollo/client/link/subscriptions'
import { getMainDefinition, } from '@apollo/client/utilities'
import { ReactNativeFile, } from 'apollo-upload-client'
import { createClient, } from 'graphql-ws'
import { useMutation, } from '@apollo/client'

// Define your GraphQL server URL
const serverUrl = 'https://your-server-url/graphql'

// Initialize the Apollo Client
const apolloClient = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    },
    new GraphQLWsLink(createClient({ url: serverUrl, })),
    createUploadLink({ uri: serverUrl, })
  ),
})

// Define and use your graphql mutation within a functional component
const [uploadFile] = useMutation(gql`mutation($file: Upload) { uploadFile(input: { image: $file }) }`)

// Upload the file to your server within an asynchronous function
const response = await uploadFile({ variables: { file: new ReactNativeFile({ uri: 'path-to-file', name: 'file', }), }, })

```
