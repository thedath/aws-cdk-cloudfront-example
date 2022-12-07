import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Cors, EndpointType, SecurityPolicy } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as certificateManager from "aws-cdk-lib/aws-certificatemanager";
import { CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { RemovalPolicy, StackProps } from "aws-cdk-lib";

export default class CloudFormationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const appName = "thedath-APIG-CDF-Test";
    const apiCustomSubDomainNameString = "v1.tapi-mapping.otterz.co";
    const distributionCustomSubDomainNameString = "v1.tapi.otterz.co";

    // --------- API GATEWAY CUSTOM DOMAIN setup ---------

    const zoneApi = new route53.HostedZone(this, `${appName}ApiHostedZone`, {
      zoneName: apiCustomSubDomainNameString,
    });
    zoneApi.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const certificateApi = new certificateManager.Certificate(
      this,
      `${appName}RestApiCertificate`,
      {
        domainName: apiCustomSubDomainNameString,
        subjectAlternativeNames: [apiCustomSubDomainNameString],
        validation: CertificateValidation.fromDns(zoneApi),
      }
    );
    certificateApi.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const apiCustomSubDomainName = new apigateway.DomainName(
      this,
      `${appName}APIDomainName`,
      {
        certificate: certificateApi,
        domainName: apiCustomSubDomainNameString,
        endpointType: EndpointType.REGIONAL,
        securityPolicy: SecurityPolicy.TLS_1_2,
      }
    );
    apiCustomSubDomainName.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const apiCustomSubDomainARecord = new route53.ARecord(
      this,
      `${appName}RestApiARecord`,
      {
        zone: zoneApi,
        recordName: apiCustomSubDomainNameString,
        target: route53.RecordTarget.fromAlias(
          new targets.ApiGatewayDomain(apiCustomSubDomainName)
        ),
        deleteExisting: true,
      }
    );
    apiCustomSubDomainARecord.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // --------- LAMBDAS ---------

    const rootLambda = new lambda.Function(this, `${appName}RootLambda`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "root.handler",
      code: lambda.Code.fromAsset(`lib/lambda`),
    });

    const testLambda = new lambda.Function(this, `${appName}TestLambda`, {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "test.handler",
      code: lambda.Code.fromAsset(`lib/lambda`),
    });

    // --------- API 1 ---------

    const api1 = new apigateway.RestApi(this, `${appName}API1`, {
      restApiName: `${appName}API1`,
      endpointTypes: [EndpointType.REGIONAL],
      deployOptions: { stageName: "playground" },
    });
    api1.root.addMethod("GET", new apigateway.LambdaIntegration(rootLambda));
    api1.root.addResource("test-path");
    api1.root
      .getResource("test-path")
      ?.addMethod("GET", new apigateway.LambdaIntegration(testLambda));
    api1.root
      .getResource("test-path")
      ?.addMethod("POST", new apigateway.LambdaIntegration(testLambda));
    api1.root
      .getResource("test-path")
      ?.addMethod("PUT", new apigateway.LambdaIntegration(testLambda));

    new apigateway.BasePathMapping(this, "api1BasePathMapping", {
      domainName: apiCustomSubDomainName,
      restApi: api1,
      basePath: "api1",
    }).applyRemovalPolicy(RemovalPolicy.DESTROY);

    // --------- API 2 ---------

    const api2 = new apigateway.RestApi(this, `${appName}API2`, {
      restApiName: `${appName}API2`,
      endpointTypes: [EndpointType.REGIONAL],
      deployOptions: { stageName: "playground" },
    });
    api2.root.addMethod("GET", new apigateway.LambdaIntegration(rootLambda));
    api2.root.addResource("test-path");
    api2.root
      .getResource("test-path")
      ?.addMethod("GET", new apigateway.LambdaIntegration(testLambda));
    api2.root
      .getResource("test-path")
      ?.addMethod("POST", new apigateway.LambdaIntegration(testLambda));
    api2.root
      .getResource("test-path")
      ?.addMethod("PUT", new apigateway.LambdaIntegration(testLambda));

    new apigateway.BasePathMapping(this, `${appName}api2BasePathMapping`, {
      domainName: apiCustomSubDomainName,
      restApi: api2,
      basePath: "api2",
    }).applyRemovalPolicy(RemovalPolicy.DESTROY);

    // --------- CLOUD FRONT CUSTOM DOMAIN SETUP ---------

    const zoneCfd = new route53.HostedZone(this, `${appName}CrdHostedZone`, {
      zoneName: distributionCustomSubDomainNameString,
    });
    zoneCfd.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const certificateCfd = new certificateManager.Certificate(
      this,
      `${appName}CfdCertificate`,
      {
        domainName: distributionCustomSubDomainNameString,
        subjectAlternativeNames: [distributionCustomSubDomainNameString],
        validation: CertificateValidation.fromDns(zoneCfd),
      }
    );
    certificateCfd.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // --------- CFD FOR API CUSTOM DOMAIN ---------

    const cachePolicy = new cloudfront.CachePolicy(
      this,
      `${appName}CachePolicy`,
      {
        cachePolicyName: `${appName}CachePolicy`,
        minTtl: cdk.Duration.seconds(2),
        maxTtl: cdk.Duration.seconds(5),
        defaultTtl: cdk.Duration.seconds(5),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true,
        headerBehavior: cloudfront.CacheHeaderBehavior.none(),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
        cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      }
    );
    cachePolicy.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const cfDistribution = new cloudfront.Distribution(
      this,
      `${appName}Distribution`,
      {
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        defaultBehavior: {
          origin: new origins.HttpOrigin(apiCustomSubDomainNameString),
          compress: true,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy,
        },
        certificate: certificateCfd,
        domainNames: [distributionCustomSubDomainNameString],
      }
    );
    cfDistribution.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const cfdARecord = new route53.ARecord(this, `${appName}RestApiARecord`, {
      zone: zoneCfd,
      recordName: distributionCustomSubDomainNameString,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(cfDistribution)
      ),
      deleteExisting: true,
    });
    cfdARecord.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
