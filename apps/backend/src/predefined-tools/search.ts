import "dotenv/config";

const search = async (query: string) => {

const params = new URLSearchParams({
    q: query
  });
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    method: 'get',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'x-subscription-token': "BSAYbvKKs7K9x1AgsgDYhYuM63siEdS",
    },
  });
  const data = await response.json();
  const results: { title: string, url: string, description: string }[] = []
  if (data && (data as any).web && (data as any).web.results) {
    (data as any).web.results.forEach((result: any, index: number) => {
      results.push({
        title: result.title,
        url: result.url,
        description: result.description
      })
    })
  }
  return results
}

const data = await search("What is the capital of France?")
console.log(data)