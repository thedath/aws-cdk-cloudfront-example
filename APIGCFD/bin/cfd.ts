#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import CloudFormationStack from "../lib/cloud-formation-stack";

const app = new cdk.App();
new CloudFormationStack(app, "Thedath-test-CFD");
