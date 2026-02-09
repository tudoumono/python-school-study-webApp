"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/../amplify_outputs.json";

if (outputs && Object.keys(outputs).length > 0) {
  Amplify.configure(outputs, { ssr: true });
}

export default function ConfigureAmplifyClientSide() {
  return null;
}
