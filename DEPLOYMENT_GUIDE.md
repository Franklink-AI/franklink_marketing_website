# Deployment Guide for franklink.ai

## Quick Start - Deploy with Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy your site:**
   ```bash
   cd c:\Users\jimmy\OneDrive\Documents\franklink_marketing_website
   vercel
   ```

3. **Follow the prompts:**
   - Login/signup to Vercel
   - Confirm project settings
   - Get your deployment URL

4. **Add Custom Domain:**
   - Go to your project in Vercel Dashboard
   - Go to Settings → Domains
   - Add `franklink.ai`
   - Update your DNS records as instructed

## Files to Deploy

Essential files:
- `index.html` - Main webpage (feature showcase homepage)
- `old-index-with-two-demo.html` - Legacy two-demo landing page
- `styles.css` - Global styling
- `feature_styles.css` - Feature showcase styling
- `script.js` - Shared interactions
- `feature_script.js` - Feature showcase interactions
- `/assets/images/branding/franklink-banner-2.png` - Logo
- `assets/images/demos/imessage/` - All demo images (phone-one and phone-two folders, iPhone frame)

## DNS Configuration

Add these records to your domain provider:

### For Vercel:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### For Netlify:
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: [your-site].netlify.app
```

## Pre-deployment Checklist

- [x] All images are optimized
- [x] JavaScript animations work
- [x] CSS is properly linked
- [x] Mobile responsive design ready
- [ ] Test on different browsers
- [ ] Check console for errors
- [ ] Verify all image paths work

## Alternative: Deploy with Netlify

1. Go to [netlify.com](https://www.netlify.com)
2. Drag your entire project folder to the deployment area
3. Add custom domain in site settings
4. Update DNS

## Alternative: GitHub Pages

1. Create GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/[your-username]/franklink-website.git
   git push -u origin main
   ```

3. Enable GitHub Pages in repository settings
4. Create CNAME file:
   ```bash
   echo "franklink.ai" > CNAME
   ```

5. Update DNS to point to GitHub Pages

## Important Notes

- The website is fully static (no backend needed)
- Total size is small, will load quickly
- Works on all modern browsers
- Mobile responsive design included

## Support

If you need help with deployment, common issues:
1. DNS propagation can take 24-48 hours
2. Clear browser cache after deployment
3. Ensure all file paths are relative, not absolute

## Next Steps After Deployment

1. Set up SSL certificate (usually automatic with Vercel/Netlify)
2. Test website on multiple devices
3. Set up analytics (Google Analytics, etc.)
4. Monitor performance
