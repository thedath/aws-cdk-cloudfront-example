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

    // const originGroups = new origins.OriginGroup({});

    const apiOrigin = new origins.HttpOrigin(props.originHTTPUrl);

    const cachePolicy = new cloudfront.CachePolicy(this, "CachePolicy", {
      cachePolicyName: "ExampleCachePolicy",
      comment: "Cache policy for testing purposes",
      minTtl: cdk.Duration.seconds(1),
      maxTtl: cdk.Duration.seconds(1 * 60 * 60 * 24 * 365),
      defaultTtl: cdk.Duration.seconds(10),
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
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.all(),
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
          accessControlAllowMethods: ["*"],
          accessControlExposeHeaders: [],
          accessControlMaxAge: cdk.Duration.seconds(600),
          originOverride: true,
        },
        securityHeadersBehavior: {},
        customHeadersBehavior: {
          customHeaders: [
            { header: "Custom-H1", override: true, value: "Custom Value 1" },
            { header: "Custom-H2", override: true, value: "Custom Value 2" },
          ],
        },
      }
    );

    const cfDistribution = new cloudfront.Distribution(this, "CfDistribution", {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      defaultBehavior: {
        origin: apiOrigin,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy,
        originRequestPolicy,
        responseHeadersPolicy,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      },
    });

    new cdk.CfnOutput(this, "cloudFormationDistributionDomainName", {
      value: cfDistribution.distributionDomainName,
      exportName: "cloudFormationDistributionDomainName",
    });
  }
}
