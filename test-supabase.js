
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL:", url);
console.log("KEY length:", key ? key.length : 0);

const supabase = createClient(url, key);

async function test() {
  console.log("Fetching materials...");
  const { data, error } = await supabase.from('materials').select('*');
  if (error) {
    console.error("Fetch Error:", error);
  } else {
    console.log("Materials:", data);
  }
}
test();
