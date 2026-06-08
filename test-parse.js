async function test() {
  const res = await fetch('http://localhost:3000/api/assets');
  const data = await res.json();
  const fetchedAssets = Array.isArray(data) ? data : data.assets;
  if (fetchedAssets) {
    const dbAssets = fetchedAssets.map((a) => {
      const val = Number(a.valuation) || 0;
      const tokens = a.totalTokens || 1;
      const unitValue = val / tokens;
      return {
        id: a.id, name: a.name, type: a.type, price: unitValue,
        yield: "12.0% a.a.", available: "100%", image: a.imageUrl || "bg-slate-700", locked: false,
        isUserAsset: true, ownerWallet: a.ownerWallet, status: a.status, description: a.description,
        tokensAvailable: a.marketTokens || 0, totalTokens: a.totalTokens || 0, valuation: val,
        isListed: a.isListed !== false,
        owner: a.owner
      };
    });
    const filtered = dbAssets.filter(a => a.status === 'APPROVED' && a.isListed === true);
    console.log("Filtered count:", filtered.length);
    if(filtered.length > 0) {
      console.log("First item:", filtered[0]);
    }
  } else {
    console.log("fetchedAssets is undefined");
  }
}
test().catch(console.error);
