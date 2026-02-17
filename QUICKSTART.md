# Quick Start Guide - EMR Simulation

Get your EMR simulation running in 5 minutes!

## 🚀 Fastest Deployment (No Password Protection)

**For immediate testing only - not secure for production!**

1. Open `emr-sim.html` in any modern web browser
2. Search for patient: `CAMPBELL, NATALIE` or MRN: `PAH599806`
3. Click to load the patient record
4. Explore the different views using the left sidebar

That's it! The system works entirely in your browser.

---

## 🔐 Quick Deployment with Password Protection

### For Shared Web Hosting (5 steps)

1. **Upload the file**
   - Log into your cPanel or FTP
   - Upload `emr-sim.html` to `public_html/emr-sim/`

2. **Generate password file**
   - Visit: https://htpasswdgenerator.net/
   - Username: `training`
   - Password: (choose a strong password)
   - Copy the generated line

3. **Create .htpasswd file**
   - In the same directory as emr-sim.html
   - Create new file: `.htpasswd`
   - Paste the line from step 2
   - Save the file

4. **Upload .htaccess file**
   - Edit the provided `.htaccess` file
   - Change the path on line 9 to match your hosting
   - Upload to same directory as emr-sim.html

5. **Access your simulation**
   - Go to: `https://yourdomain.com/emr-sim/emr-sim.html`
   - Enter username and password when prompted

### For Docker on VPS (5 commands)

```bash
# 1. Create directory and move into it
mkdir emr-sim && cd emr-sim

# 2. Create the HTML file (paste content into nano editor)
nano emr-sim.html

# 3. Create Docker setup
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  emr:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./emr-sim.html:/usr/share/nginx/html/index.html:ro
    restart: unless-stopped
EOF

# 4. Start the container
docker-compose up -d

# 5. Access at http://your-server-ip:8080
```

---

## 📋 Sample Patient Credentials

**Patient 1 (Complete Record):**
- Name: CAMPBELL, NATALIE
- MRN: PAH599806
- DOB: 16-Nov-1967
- Features: Full vitals, medications, lab results, clinical notes

**Patient 2 (Template):**
- Name: DUMMY, DUMMY
- MRN: LABH999999
- DOB: 31-May-1965
- Features: Empty template for testing

---

## 🎯 Key Features to Test

1. **Patient Search**
   - Type name or MRN
   - Click to load patient

2. **Doctor View**
   - See vital signs summary
   - View recent clinical notes
   - Click notes to expand/collapse

3. **Vital Signs**
   - View detailed vital signs table
   - Check trends over time

4. **Medications (MAR)**
   - See all prescribed medications
   - Check dosing schedules

5. **Orders**
   - Add new laboratory orders
   - Sign pending orders

6. **Results**
   - View lab results
   - See abnormal values highlighted

7. **Documentation**
   - Browse all clinical notes
   - Read full documentation

---

## ⚡ Common First-Time Issues

**Can't find the patient?**
- Make sure you're typing the exact name or MRN
- Search is case-insensitive but must match

**Password prompt won't accept credentials?**
- Check .htpasswd file was created correctly
- Verify .htaccess path is correct for your hosting

**Page shows blank?**
- Check browser console (F12) for errors
- Ensure file uploaded completely
- Try a different browser (Chrome, Firefox, Edge)

**Docker container won't start?**
- Check if port 8080 is already in use: `sudo lsof -i :8080`
- View logs: `docker-compose logs`

---

## 🔒 Security Reminder

**CRITICAL:** This is a training simulation only!

- ✅ Use fictional patient data only
- ✅ Enable password protection for production
- ✅ Use HTTPS (SSL certificate)
- ✅ Restrict access to training staff only
- ❌ Never use real patient information
- ❌ Never make publicly accessible
- ❌ Never index in search engines

---

## 📚 Next Steps

Once you have it running:

1. **Read the full README.md** for detailed documentation
2. **Review DEPLOYMENT.md** for production setup
3. **Check patient-template.json** to add your own scenarios
4. **Customize the interface** to match your EMR branding
5. **Train your staff** on accessing the system

---

## 🆘 Need Help?

**Check these in order:**

1. **Browser Console** (Press F12, click Console tab)
   - Look for error messages
   - Copy any errors for troubleshooting

2. **Server Logs** (if using web hosting)
   - Check error_log in cPanel
   - Look for authentication errors

3. **Docker Logs** (if using container)
   ```bash
   docker-compose logs -f
   ```

4. **Documentation**
   - README.md - Full feature documentation
   - DEPLOYMENT.md - Detailed deployment guide
   - patient-template.json - Patient data examples

---

## 💡 Pro Tips

1. **Bookmark the URL** for quick access during training
2. **Use different browsers** to test multiple scenarios simultaneously
3. **Create training scenarios** based on common clinical cases
4. **Practice navigation** before using in actual training sessions
5. **Keep patient data realistic** but completely fictional
6. **Update scenarios regularly** to keep training fresh
7. **Test on mobile devices** - it works on tablets and phones too!

---

## ✅ Deployment Checklist

Before going live:

- [ ] File uploaded and accessible
- [ ] Password protection configured and tested
- [ ] HTTPS/SSL enabled (for production)
- [ ] robots.txt configured to prevent indexing
- [ ] Access restricted to authorized users
- [ ] Only fictional patient data loaded
- [ ] Tested in multiple browsers
- [ ] Tested on different devices
- [ ] Staff trained on access procedures
- [ ] Backup procedure established

---

**Ready to deploy?** Pick your method above and get started!

**Questions?** Check the comprehensive documentation in README.md

**Good luck with your EMR simulation training! 🏥**
