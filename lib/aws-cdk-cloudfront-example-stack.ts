import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Cors } from "aws-cdk-lib/aws-apigateway";

export class AwsCdkCloudfrontExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const apiGateway = new apigateway.RestApi(this, "ApiWithWAFEnabled", {
      restApiName: "ApiWithWAFEnabled",
    });

    const rootLambda = new lambda.Function(this, "ApiGETLambda", {
      functionName: "ApiGETLambda",
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "root.handler",
      code: lambda.Code.fromAsset(`lib/lambda`),
    });

    const testLambda = new lambda.Function(this, "ApiGETLambda", {
      functionName: "ApiGETLambda",
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "test.handler",
      code: lambda.Code.fromAsset(`lib/lambda`),
    });

    apiGateway.root.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: ["GET"],
    });
    apiGateway.root.addMethod(
      "GET",
      new apigateway.LambdaIntegration(rootLambda)
    );

    apiGateway.root
      .addResource("test", {
        defaultCorsPreflightOptions: {
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: ["GET"],
        },
      })
      .addMethod("POST", new apigateway.LambdaIntegration(testLambda));

    const apiOrigin = new origins.HttpOrigin(apiGateway.url);
    const cfDistribution = new cloudfront.Distribution(this, "CfDistribution", {
      defaultBehavior: { origin: apiOrigin },
    });
  }
}
