export default function Home() {
  return (
    <>
      <link rel="stylesheet" href="/styles.css" />
      <div dangerouslySetInnerHTML={{ __html: `
$(cat public/index.html | sed '1,6d;$d' | sed '/<style>/,/<\/style>/d;/<script>/,/<\/script>/d')
      ` }} />
    </>
  );
}
