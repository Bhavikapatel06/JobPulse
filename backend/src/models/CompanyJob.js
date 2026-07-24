const mongoose = require('mongoose');

/**
 * Individual job opening sub-document schema.
 */
const jobSchema = new mongoose.Schema(
  {
    // Unique identifier per job (SHA256 of title+location or URL slug)
    jobId:         { type: String, trim: true, default: null },
    title:         { type: String, required: true, trim: true },
    location:      { type: String, trim: true, default: 'Not specified' },
    experience:    { type: String, trim: true, default: 'Not specified' },
    employmentType:{ type: String, trim: true, default: 'Not specified' },
    description:   { type: String, trim: true, default: '' },
    applyLink:     { type: String, trim: true, default: '' },
    postedDate:    { type: String, default: null },
  },
  { _id: false }
);

/**
 * CompanyJobs collection – single source of truth for all job data.
 *
 * One document per company. All users that follow a company
 * read from this same document – jobs are NEVER duplicated per user.
 */
const companyJobSchema = new mongoose.Schema(
  {
    // Normalised company lookup key e.g. "google"
    company: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Display name as entered by user e.g. "Google"
    companyDisplayName: { type: String, trim: true },

    // Cached official careers page URL – reused across all runs
    careersUrl: { type: String, trim: true, default: null },

    // Scraped job listings (single copy, shared across all users)
    jobs: [jobSchema],

    // When this record was last refreshed by the Scraping Agent
    lastUpdated: { type: Date, default: null },

    // Scrape health tracking
    scrapeStatus: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
    },

    // Last error message if scrapeStatus === "failed"
    lastError: { type: String, default: null },
  },
  { timestamps: true }
);

// Only lastUpdated needs an index; company is already indexed via unique:true
companyJobSchema.index({ lastUpdated: 1 });

module.exports = mongoose.model('CompanyJob', companyJobSchema);
