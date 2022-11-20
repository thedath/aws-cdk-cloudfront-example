import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";

export interface CloudFormationStackProps extends cdk.StackProps {
  originHTTPUrl: string;
}

export default class CloudFormationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CloudFormationStackProps) {
    super(scope, id, props);

    const apiOrigin = new origins.HttpOrigin(props.originHTTPUrl);

    // const originGroups = new origins.OriginGroup({
    //   primaryOrigin: apiOrigin,
    //   fallbackOrigin: apiOrigin,
    // });

    const cachePolicy = new cloudfront.CachePolicy(this, "CachePolicy", {
      cachePolicyName: "ExampleCachePolicy",
      comment: "Cache policy for testing purposes",
      minTtl: cdk.Duration.seconds(10),
      maxTtl: cdk.Duration.seconds(1 * 60 * 60 * 24 * 365),
      defaultTtl: cdk.Duration.seconds(30),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
        "x-cache-test1",
        "x-cache-test2"
      ),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList(
        "param1",
        "param2"
      ),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    const originRequestPolicy = new cloudfront.OriginRequestPolicy(
      this,
      "OriginRequestPolicy",
      {
        originRequestPolicyName: "ExampleOriginRequestPolicy",
        comment: "Origin request policy for testing purposes",
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.all(
          "CloudFront-Viewer-City",
          "CloudFront-Viewer-Country-Name",
          "CloudFront-Viewer-Country-Region",
          "CloudFront-Viewer-Time-Zone",
          "CloudFront-Is-Android-Viewer",
          "CloudFront-Is-Desktop-Viewer",
          "CloudFront-Is-IOS-Viewer",
          "CloudFront-Is-Mobile-Viewer",
          "CloudFront-Is-SmartTV-Viewer",
          "CloudFront-Is-Tablet-Viewer"
        ),
        queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
        cookieBehavior: cloudfront.OriginRequestQueryStringBehavior.none(),
      }
    );

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      "ResponseHeadersPolicy",
      {
        responseHeadersPolicyName: "ResponseHeaderPolicy",
        comment: "ExampleResponseHeaderPolicy",
        corsBehavior: {
          accessControlAllowCredentials: false,
          accessControlAllowOrigins: ["*"],
          accessControlAllowHeaders: ["*"],
          accessControlAllowMethods: [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "PATCH",
            "HEAD",
            "OPTIONS",
          ],
          accessControlMaxAge: cdk.Duration.seconds(600),
          originOverride: false,
        },
        securityHeadersBehavior: {
          xssProtection: { protection: true, override: true, modeBlock: true },
          contentTypeOptions: { override: true },
        },
        customHeadersBehavior: {
          customHeaders: [
            { header: "Custom-H1", override: true, value: "Custom Value 1" },
            { header: "Custom-H2", override: true, value: "Custom Value 2" },
          ],
        },
      }
    );

    const behavior: cloudfront.BehaviorOptions = {
      origin: apiOrigin,
      compress: true,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      cachePolicy,
      // originRequestPolicy,
      responseHeadersPolicy,
      smoothStreaming: false,
    };

    const cfDistribution = new cloudfront.Distribution(this, "CfDistribution", {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      defaultBehavior: behavior,
      additionalBehaviors: {
        "/dev/*": behavior,
      },
    });

    new cdk.CfnOutput(this, "cloudFormationDistributionDomainName", {
      value: cfDistribution.distributionDomainName,
      exportName: "cloudFormationDistributionDomainName",
    });
  }
}
