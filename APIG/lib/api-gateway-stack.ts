import * as cdk from "aws-cdk-lib";
import { CfnOutput } from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Cors, EndpointType } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export default class ApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const apiGateway = new apigateway.RestApi(
      this,
      "ApiGatewayForCFDistribution",
      {
        restApiName: "ApiGatewayForCFDistribution",
        endpointTypes: [EndpointType.EDGE],
        deployOptions: { stageName: "dev" },
      }
    );

    const rootLambda = new lambda.Function(this, "RootGETLambda", {
      functionName: "RootGETLambda",
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "root.handler",
      code: lambda.Code.fromAsset(`lib/lambda`),
    });

    const testLambda = new lambda.Function(this, "TestGETLambda", {
      functionName: "TestGETLambda",
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "test.handler",
      code: lambda.Code.fromAsset(`lib/lambda`),
    });

    // apiGateway.root.addCorsPreflight({
    //   allowOrigins: Cors.ALL_ORIGINS,
    //   allowMethods: ["GET"],
    // });
    apiGateway.root.addMethod(
      "GET",
      new apigateway.LambdaIntegration(rootLambda)
    );

    apiGateway.root.addResource("test");

    apiGateway.root
      .getResource("test")
      ?.addMethod("POST", new apigateway.LambdaIntegration(testLambda));

    new CfnOutput(this, "ApiGatewayBaseURL", {
      exportName: "baseUrl",
      value: apiGateway.url,
    });

    new CfnOutput(this, "ApiGatewayHTTPMethods", {
      exportName: "methods",
      value: apiGateway.methods.join(","),
    });
  }
}
