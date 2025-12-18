# Railway Volume Setup for File Storage

## Problem
Railway containers are ephemeral - files uploaded to the local filesystem are deleted on each deployment. You need persistent storage for course materials.

## Solution: Add a Railway Volume

### Steps to Add Volume:

1. **Go to your Railway project dashboard**
   - Navigate to your service settings

2. **Click on "Volumes" tab**
   - Click "Add Volume"

3. **Configure the volume:**
   - **Mount Path**: `/app/storage`
   - **Size**: Start with 1GB (can be increased later)
   - Click "Add"

4. **Redeploy your application**
   - Railway will automatically redeploy with the volume attached

### What this does:
- Mounts a persistent volume to `/app/storage`
- All files in `storage/app/public/course_materials/` will persist across deployments
- The volume is backed up and survives container restarts

### Cost:
- Railway volumes are charged separately from compute
- Approximately $0.25/GB/month
- 1GB should be sufficient for starting

### Alternative: Cloud Storage (AWS S3, Cloudflare R2, etc.)
If you prefer cloud storage instead of Railway volumes, you can:
1. Set up an S3 bucket (or S3-compatible service)
2. Update `.env` to use S3:
   ```
   FILESYSTEM_DISK=s3
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_DEFAULT_REGION=us-east-1
   AWS_BUCKET=your_bucket_name
   ```
3. No volume needed - files stored in cloud

## Recommended: Railway Volume
For your use case, a Railway volume is simpler and more cost-effective for small to medium file storage needs.

