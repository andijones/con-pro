import { AuthHeading } from "../auth-heading";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in" };

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const sp = await props.searchParams;
  const from = typeof sp.from === "string" ? sp.from : "/";
  return (
    <>
      <AuthHeading lede="Use your NHS or council work email.">Sign in</AuthHeading>
      <SignInForm from={from} />
    </>
  );
}
