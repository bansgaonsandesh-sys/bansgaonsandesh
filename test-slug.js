const slugify = require('slugify');

function generateSlug(title, id) {
  if (!title || !title.trim()) {
    return id;
  }

  const slug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
    locale: 'hi',
    remove: /[*+~.()'"!:@]/g
  })
    .substring(0, 60)
    .replace(/-+$/g, '');

  if (!slug || slug.length === 0) {
    return id;
  }

  return `${slug}-${id}`;
}

function extractIdFromSlug(slug) {
  const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
  const match = slug.match(uuidRegex);
  
  if (match) {
    return match[1];
  }
  
  return slug;
}

// Test cases
const testCases = [
  {
    title: 'स्वर्गीय ब्रह्मदेव मद्धेशिया की स्मृति में बांटे गए कंबल गोरखपुर पीपीगंज क्षेत्र',
    id: '54eb0a03-2a43-4c3b-9ffd-ec2f74113e28'
  },
  {
    title: 'पुरानी रंजिश में किशोर की गोली मारकर हत्या, शव रखकर प्रदर्शन',
    id: 'b8d621b7-46d2-4573-94b7-4d45a948e281'
  },
  {
    title: null,
    id: '12345678-1234-1234-1234-123456789abc'
  }
];

console.log('=== SLUG GENERATION TESTS ===\n');
testCases.forEach(({ title, id }) => {
  const slug = generateSlug(title, id);
  const extracted = extractIdFromSlug(slug);
  const plainExtracted = extractIdFromSlug(id);
  
  console.log('Title:', title || 'NULL');
  console.log('UUID:', id);
  console.log('Generated Slug:', slug);
  console.log('Extracted from Slug:', extracted);
  console.log('Extracted from Plain UUID:', plainExtracted);
  console.log('Match:', extracted === id && plainExtracted === id ? '✅ PASS' : '❌ FAIL');
  console.log('');
});
