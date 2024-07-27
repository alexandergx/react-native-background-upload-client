# react-native-graphql-background-upload
Handle multipart file uploads to your Graphql server from your React Native app with Apollo.

Currently only supports iOS.

(Forked from "react-native-background-upload")

# Installation

## 1. Install package

`npm install --save react-native-graphql-background-upload`

or

`yarn add react-native-graphql-background-upload`

## 2. Link Native Code

### Autolinking (React Native >= 0.60)

##### iOS

`cd ./ios && pod install && cd ../`

### Automatic Native Library Linking (React Native < 0.60)

`react-native link react-native-graphql-background-upload`

### Or, Manually Link It

#### iOS

1. In the XCode's "Project navigator", right click on your project's Libraries folder ➜ `Add Files to <...>`
2. Go to `node_modules` ➜ `react-native-graphql-background-upload` ➜ `ios` ➜ select `RNGraphqlFileUploader.xcodeproj`
3. Add `RNGraphqlFileUploader.a` to `Build Phases -> Link Binary With Libraries`

## 3. Expo

To use this library with [Expo](https://expo.io) one must first detach (eject) the project and follow [step 2](#2-link-native-code) instructions. Additionally on iOS there is a must to add a Header Search Path to other dependencies which are managed using Pods. To do so one has to add `$(SRCROOT)/../../../ios/Pods/Headers/Public` to Header Search Path in `RNGraphqlFileUploader` module using XCode.

# Usage

```js

// Simply take the standard apollo createUploadLink...
import { createUploadLink, } from 'apollo-upload-client'

// ... and replace it with this!
import { createUploadLink, } from 'react-native-graphql-background-upload'

```
