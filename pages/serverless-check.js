export default function ServerlessCheck({ time }) {
  return <div>Serverless page built at {time}</div>;
}

export async function getServerSideProps() {
  return { props: { time: new Date().toISOString() } };
}
