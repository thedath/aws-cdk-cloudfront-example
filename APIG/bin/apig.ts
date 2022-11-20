#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import ApiGatewayStack from "../lib/api-gateway-stack";

const app = new cdk.App();

new ApiGatewayStack(app, "OriginApiGatewayStack", {
  stackName: "OriginApiGatewayStack",
  env: { account: "448535425092", region: "us-west-2" },
});

new ApiGatewayStack(app, "VirginiaApiGatewayStack", {
  stackName: "VirginiaApiGatewayStack",
  env: { account: "448535425092", region: "us-east-1" },
});
