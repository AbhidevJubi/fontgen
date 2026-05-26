# FontLightbox Refactor - Quick Reference & Testing Guide

## ⚡ Quick Implementation Summary

### What Changed

- ❌ REMOVED: Fake preset styles (Gold, Steel, Fire, Neon, Glow)
- ❌ REMOVED: Manual text rendering with gradients/shadows
- ✅ ADDED: Real Gemini Flash API integration
- ✅ ADDED: Chroma key processing (removes green background)
- ✅ ADDED: AI image overlay on user's background

### Key Files

| File                              | Status       | Notes                           |
| --------------------------------- | ------------ | ------------------------------- |
| `app/components/FontLightbox.tsx` | ✏️ Modified  | Complete refactor (~500 lines)  |
| `lib/api-client.ts`               | ✅ Exists    | Has `generateTitle()` function  |
| `lib/chroma-key.ts`               | ✅ Exists    | Has `chromaKeyImage()` function |
| `app/api/generate-title/route.ts` | ✅ Exists    | Gemini Flash endpoint           |
| `FontLightbox.css`                | ✅ No change | Styling still applicable        |

---

## 🧪 Testing Guide

### Prerequisites

1. **Environment Variable**: Set in `.env.local`

   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

2. **Dependencies Installed**: Run `npm install` (already done)

3. **Database**: Have reference font images in Supabase or using local paths

### Step-by-Step Test

#### Test 1: Basic Generation Flow

```
1. Open the app → Click any movie card "Try Now"
2. FontLightbox opens (Step 1)
3. Enter text: "PATHAAN"
4. Upload a background image OR click a sample
5. Click "Generate Title Font"
   ↓ Should show loading spinner for 2-3 seconds
6. Canvas appears with background + AI text overlay
7. ✅ SUCCESS if text is visible and has no green background
```

#### Test 2: Adjustment Controls

```
1. After generation in Step 2:
2. Adjust "Title Size" slider (20-150%)
   ↓ AI text image should resize on canvas
3. Adjust "Horizontal Position (X)" (0-100%)
   ↓ Text should move left-right
4. Adjust "Vertical Position (Y)" (0-100%)
   ↓ Text should move up-down
5. Click and drag on canvas
   ↓ Text position should update
6. ✅ SUCCESS if all controls work smoothly
```

#### Test 3: Download Quality

```
1. After adjustments in Step 2:
2. Click "Download JPG" button
3. Save the file
4. Open the downloaded JPG
   ↓ Should show background + properly positioned AI text
   ↓ Should be high quality (compression: 0.95)
5. ✅ SUCCESS if image looks good and composite is correct
```

#### Test 4: Error Handling

```
1. Try generating with INVALID GEMINI_API_KEY:
   ↓ Should show error message in red box
   ↓ Should go back to Step 1
   ✅ SUCCESS
2. Try with EMPTY API KEY:
   ↓ Should fail with clear error
   ✅ SUCCESS
3. Try with DISCONNECTED INTERNET:
   ↓ Should fail with network error
   ✅ SUCCESS
```

#### Test 5: Different Movies

```
1. Test with 3+ different movies
2. For each, verify:
   - AI text matches the movie's font style (visual check)
   - Generation completes successfully
   - Canvas displays correctly
3. ✅ SUCCESS if all work
```

### Console Log Inspection

Open DevTools (F12) → Console tab, you should see:

```
🎬 Starting AI generation for: PATHAAN
📸 Converting reference image...
🤖 Calling Gemini Flash API...
✨ Gemini generation completed, applying chroma key...
🎨 Chroma key applied successfully
```

If any step is missing, check the error:

```
❌ Generation error: [error message]
```

### Network Tab Inspection

Monitor `POST /api/generate-title`:

- **Request payload**: Should have userText, userImageBase64, referenceImageBase64, movieName
- **Response**: Should have `generatedImage` (base64 PNG with green background)
- **Status**: Should be 200
- **Time**: Should be 2-4 seconds

---

## 🔧 Troubleshooting

### Issue: "No image returned from generation"

```
Cause: API response is empty or malformed
Check:
1. GEMINI_API_KEY is valid
2. API quota not exceeded
3. Reference image is valid PNG
4. Network connection works

Fix:
1. Verify GEMINI_API_KEY in .env.local
2. Check Google Cloud console for quota
3. Check reference image at font.titleImage URL
4. Test API with curl:
   curl -X POST http://localhost:3000/api/generate-title \
     -H "Content-Type: application/json" \
     -d '{"userText":"TEST","userImageBase64":"...","referenceImageBase64":"...","movieName":"Pathaan"}'
```

### Issue: "Canvas shows only background, no text"

```
Cause: aiGeneratedImage is null or not loaded
Check:
1. Check if chromaKeyImage is being called
2. Check browser console for Image.onerror
3. Verify AI image data URL is valid

Debug:
1. Add console.log before setAiGeneratedImage
2. Check if chromaKeyedImage has content
3. Verify textImg.src is being set correctly
```

### Issue: "Green background not removed properly"

```
Cause: greenThreshold parameter needs adjustment
Fix:
1. Change in FontLightbox.tsx:
   const chromaKeyedImage = await chromaKeyImage(result.generatedImage, 150);
                                                                      ↑
   Try values: 100, 120, 150, 180, 200
2. Test with different values until background is fully transparent
```

### Issue: "Sliders not working / no visual feedback"

```
Cause: drawCanvas not being called on state change
Check:
1. Verify drawCanvas dependencies: [step, userImage, aiGeneratedImage, titleSize, posX, posY, isGenerating]
2. Verify useEffect calling drawCanvas
3. Open DevTools → check if errors are thrown

Fix:
1. Ensure all state vars are in dependency array
2. Check for JavaScript errors in console
3. Clear cache and reload (Ctrl+Shift+R)
```

### Issue: "API Key Error"

```
Error: "GEMINI_API_KEY not found" or "Invalid API key"
Fix:
1. Verify .env.local has GEMINI_API_KEY set
2. Verify key format is correct (starts with 'sk-' or similar)
3. Verify key is active in Google Cloud console
4. Next.js caches env vars, restart dev server:
   npm run dev
5. After restart, verify with:
   console.log(process.env.GEMINI_API_KEY)
```

---

## 📊 Performance Metrics

### Expected Timings

| Operation               | Time        | Notes                        |
| ----------------------- | ----------- | ---------------------------- |
| Image upload conversion | 0.5-1 sec   | JavaScript base64 conversion |
| Reference image conv.   | 0.2-0.5 sec | Usually cached               |
| Gemini API call         | 2-4 sec     | Includes network latency     |
| Chroma key processing   | 0.5-1 sec   | Canvas pixel manipulation    |
| Canvas draw (each)      | < 50ms      | Hardware accelerated         |
| **Total Step 1→2**      | 3-6 sec     | Typical range                |

### Optimization

- **Pre-cache reference**: Convert to base64 once, store in state
- **Compress images**: Limit user uploads to 2MB
- **Use WebWorker**: For very large images (> 5MB)
- **Lazy load**: Only convert images when needed

---

## ✅ Validation Checklist

Before considering complete:

- [ ] TypeScript errors: 0 (verify with `npm run build`)
- [ ] Console errors: None in DevTools
- [ ] API logs: Show successful POST to /generate-title
- [ ] Visual test: AI text appears on canvas
- [ ] Green removal: No green pixels visible (or very faint)
- [ ] Controls: Size/position sliders work
- [ ] Download: JPG exports with correct composite
- [ ] Multiple movies: All generate correctly
- [ ] Error case: Shows friendly error message
- [ ] Performance: Generation takes 3-6 seconds

---

## 🚀 Deployment Checklist

Before pushing to production:

- [ ] Set GEMINI_API_KEY in production environment
- [ ] Test in production environment
- [ ] Monitor API usage/costs
- [ ] Set up error logging/monitoring
- [ ] Add rate limiting to /api/generate-title endpoint
- [ ] Test with various image sizes
- [ ] Test on mobile devices
- [ ] Load test with multiple concurrent users
- [ ] Have fallback UI if API is down
- [ ] Document API quotas and costs

---

## 📝 Code Review Points

Key changes to verify:

1. **Imports** (lines 5-6):
   - ✅ `import { generateTitle, imageUrlToBase64 } from "@/lib/api-client";`
   - ✅ `import { chromaKeyImage } from "@/lib/chroma-key";`

2. **State** (lines 17-24):
   - ✅ Removed: `textStyle` state
   - ✅ Removed: `TextStylePreset` type
   - ✅ Added: `aiGeneratedImage` state
   - ✅ Added: `generationError` state

3. **handleGenerate()** (lines 66-132):
   - ✅ Validates input
   - ✅ Converts images to base64
   - ✅ Calls generateTitle() API
   - ✅ Calls chromaKeyImage()
   - ✅ Sets aiGeneratedImage state
   - ✅ Error handling with try-catch

4. **drawCanvas()** (lines 168-225):
   - ✅ No manual text drawing
   - ✅ Draws background image
   - ✅ Overlays AI image
   - ✅ Respects titleSize, posX, posY
   - ✅ Maintains aspect ratio

5. **JSX Changes** (Step 2):
   - ✅ Removed: `.styles-presets-wrap` section
   - ✅ Added: Error display UI
   - ✅ Updated: Form notes text
   - ✅ Updated: Loading spinner text

---

## 🎯 Success Criteria

The refactor is complete when:

1. ✅ No TypeScript compilation errors
2. ✅ App runs without console errors
3. ✅ Can generate AI text successfully
4. ✅ Green background is removed
5. ✅ Can adjust size and position
6. ✅ Can download JPG with correct composite
7. ✅ Error messages are user-friendly
8. ✅ Works with multiple movies
9. ✅ Performance is acceptable (3-6 sec)
10. ✅ Ready for production deployment

---

## 📚 Reference Links

- [Gemini Flash API Docs](https://ai.google.dev/api)
- [Canvas API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Chrome DevTools Guide](https://developer.chrome.com/docs/devtools/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 📞 Support

If issues arise, check in this order:

1. Console logs (what step failed?)
2. Network tab (is API responding?)
3. Environment variables (are they set?)
4. Browser DevTools (any errors?)
5. This troubleshooting guide
6. Review FONTLIGHTBOX_REFACTOR.md for details
