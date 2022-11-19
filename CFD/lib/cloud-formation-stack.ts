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
    const cfDistribution = new cloudfront.Distribution(this, "CfDistribution", {
      defaultBehavior: { origin: apiOrigin },
    });
  }
}
