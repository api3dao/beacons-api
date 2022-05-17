An `event` with query string parameters looks like this:
```json
{
    "resource": "/operations/beacons",
    "path": "/operations/beacons",
    "httpMethod": "GET",
    "headers": {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        "CloudFront-Forwarded-Proto": "https",
        "CloudFront-Is-Desktop-Viewer": "true",
        "CloudFront-Is-Mobile-Viewer": "false",
        "CloudFront-Is-SmartTV-Viewer": "false",
        "CloudFront-Is-Tablet-Viewer": "false",
        "CloudFront-Viewer-Country": "ZA",
        "dnt": "1",
        "Host": "oq3gx7zzma.execute-api.us-east-1.amazonaws.com",
        "sec-ch-ua": "user agenty thing",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Linux\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1",
        "User-Agent": "user agenty thing",
        "Via": "2.0 eb5c8f6a42034e4582f1e714f130879e.cloudfront.net (CloudFront)",
        "X-Amz-Cf-Id": "g-Xmb9kSCJQZ14mQr-Av37e3gToeB88KT5YniHxJsumqN0pjPA9eBg==",
        "X-Amzn-Trace-Id": "Root=1-6257fd3b-5dd6aa8a7b6dda8e2ed2a396",
        "X-Forwarded-For": "0.0.0.1, 0.0.0.2",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https"
    },
    "multiValueHeaders": {
        "Accept": [
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
        ],
        "Accept-Encoding": [
            "gzip, deflate, br"
        ],
        "Accept-Language": [
            "en-GB,en-US;q=0.9,en;q=0.8"
        ],
        "CloudFront-Forwarded-Proto": [
            "https"
        ],
        "CloudFront-Is-Desktop-Viewer": [
            "true"
        ],
        "CloudFront-Is-Mobile-Viewer": [
            "false"
        ],
        "CloudFront-Is-SmartTV-Viewer": [
            "false"
        ],
        "CloudFront-Is-Tablet-Viewer": [
            "false"
        ],
        "CloudFront-Viewer-Country": [
            "US"
        ],
        "dnt": [
            "1"
        ],
        "Host": [
            "oq3gx7zzma.execute-api.us-east-1.amazonaws.com"
        ],
        "sec-ch-ua": [
            "user agenty thing"
        ],
        "sec-ch-ua-mobile": [
            "?0"
        ],
        "sec-ch-ua-platform": [
            "\"Linux\""
        ],
        "sec-fetch-dest": [
            "document"
        ],
        "sec-fetch-mode": [
            "navigate"
        ],
        "sec-fetch-site": [
            "none"
        ],
        "sec-fetch-user": [
            "?1"
        ],
        "sec-gpc": [
            "1"
        ],
        "upgrade-insecure-requests": [
            "1"
        ],
        "User-Agent": [
            "user agenty thing"
        ],
        "Via": [
            "2.0 eb5c8f6a42034e4582f1e714f130879e.cloudfront.net (CloudFront)"
        ],
        "X-Amz-Cf-Id": [
            "g-Xmb9kSCJQZ14mQr-Av37e3gToeB88KT5YniHxJsumqN0pjPA9eBg=="
        ],
        "X-Amzn-Trace-Id": [
            "Root=1-6257fd3b-5dd6aa8a7b6dda8e2ed2a396"
        ],
        "X-Forwarded-For": [
            "anip, anipagain"
        ],
        "X-Forwarded-Port": [
            "443"
        ],
        "X-Forwarded-Proto": [
            "https"
        ]
    },
    "queryStringParameters": {
        "id": "0"
    },
    "multiValueQueryStringParameters": {
        "id": [
            "0"
        ]
    },
    "pathParameters": null,
    "stageVariables": null,
    "requestContext": {
        "resourceId": "nxkb8m",
        "resourcePath": "/operations/beacons",
        "httpMethod": "GET",
        "extendedRequestId": "QkSBVFL0oAMFdcQ=",
        "requestTime": "14/Apr/2022:10:53:47 +0000",
        "path": "/production/operations/beacons",
        "accountId": "938433763602",
        "protocol": "HTTP/1.1",
        "stage": "production",
        "domainPrefix": "oq3gx7zzma",
        "requestTimeEpoch": 1649933627585,
        "requestId": "0ae91b09-4ce2-4acc-a4c9-23439f4d13cf",
        "identity": {
            "cognitoIdentityPoolId": null,
            "accountId": null,
            "cognitoIdentityId": null,
            "caller": null,
            "sourceIp": "165.73.113.252",
            "principalOrgId": null,
            "accessKey": null,
            "cognitoAuthenticationType": null,
            "cognitoAuthenticationProvider": null,
            "userArn": null,
            "userAgent": "user agenty thing",
            "user": null
        },
        "domainName": "oq3gx7zzma.execute-api.us-east-1.amazonaws.com",
        "apiId": "oq3gx7zzma"
    },
    "body": null,
    "isBase64Encoded": false
}
```