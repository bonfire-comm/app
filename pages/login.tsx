import Layout from '@/components/Layout';
import Meta from '@/components/Meta';
import { Button, TextInput } from '@mantine/core';

export default function Login() {
  return (
    <Layout>
      <Meta page="Login" />

      <section className="w-full h-screen grid place-items-center">
        <section className="border border-cloudy-500 bg-cloudy-600 w-[40rem] h-1/2 rounded-xl p-8">
          <h2 className="font-extrabold text-3xl text-center mb-2">Welcome back!</h2>
          <p className="opacity-75 text-center">Nice to see you again!</p>

          <section>
            <section>
              <TextInput label="EMAIL" />

              <Button>Submit</Button>
            </section>
          </section>
        </section>
      </section>
    </Layout>
  );
}