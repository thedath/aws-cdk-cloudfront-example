#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import CloudFormationStack from "../lib/cloud-formation-stack";

const app = new cdk.App();
new CloudFormationStack(app, "CloudFormationStack", {
  env: { account: "448535425092", region: "us-west-2" },
  primaryOriginHTTPUrl: "3pfuk6r5uc.execute-api.us-west-2.amazonaws.com",
  fallbackOriginHTTPUrl: "i5kj2bdega.execute-api.us-east-1.amazonaws.com",
});
