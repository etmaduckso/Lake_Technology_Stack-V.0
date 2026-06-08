async function test() {
  const res = await fetch('http://localhost:3000/api/assets');
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Data:", text.substring(0, 500)); // print first 500 chars to avoid huge logs
}
test().catch(console.error);
