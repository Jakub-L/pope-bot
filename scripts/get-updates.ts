const updates: ImageUpdate[] = [];
for (let i = 0; i < links.length; i++) {
  if (i > 0 && i % 100 === 0) console.log(`Processed ${i} links...`);
  const link = links[i];
  const update = await getUpdate(link);
  if (update) updates.push(update);
}
console.log(`Total updates to process: ${updates.length}`);
