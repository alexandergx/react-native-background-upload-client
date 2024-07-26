//  RNGraphqlFileUploader.h

#import <Foundation/Foundation.h>
#import <MobileCoreServices/MobileCoreServices.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

@interface RNGraphqlFileUploader : RCTEventEmitter <RCTBridgeModule, NSURLSessionTaskDelegate>
    +(RNGraphqlFileUploader*)sharedInstance;
    -(void)setBackgroundSessionCompletionHandler:(void (^)(void))handler;
    @property (atomic) BOOL isObserving;
@end
