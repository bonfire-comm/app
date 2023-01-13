import Head from 'next/head';

interface Props {
  page?: string;
}

export default function Meta({ page = 'Home' }: Props) {
  return (
    <Head>
      <title>BONFiRE | {page}</title>

      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <meta name="description" content="BONFiRE is an online communication service for people!" />
      <meta name="theme-color" content="#101921" />
    </Head>
  );
}