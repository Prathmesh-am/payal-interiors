import React, { useState, useMemo } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Stack,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMedia, uploadMedia } from "../services/mediaService"; // Assuming the same service functions

// --- Main Page Component ---

const MediaLibraryPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTag, setSelectedTag] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMediaId, setSelectedMediaId] = useState(null); // Used for highlighting in the library view

  // Fetch Media Data
  const {
    data: mediaList = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["media"],
    queryFn: fetchMedia,
    // No 'enabled' check needed here since it's a full page component
  });

  // Calculate all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    mediaList.forEach((m) => (m.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [mediaList]);

  // Apply filtering by tag and search term
  const filteredMedia = useMemo(() => {
    let list = mediaList;

    // Filter by Tag
    if (selectedTag) {
      list = list.filter((m) => m.tags?.includes(selectedTag));
    }

    // Filter by Search Term (filename, title, tags)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      list = list.filter(
        (m) =>
          m.filename?.toLowerCase().includes(lowerSearchTerm) ||
          m.title?.toLowerCase().includes(lowerSearchTerm) ||
          m.tags?.some((t) => t.toLowerCase().includes(lowerSearchTerm))
      );
    }

    return list;
  }, [selectedTag, searchTerm, mediaList]);

  // Handle media selection (primarily for the highlight effect, less critical than in a picker)
  const handleSelectMedia = (media) => {
    setSelectedMediaId(media._id === selectedMediaId ? null : media._id);
    // In a full page, you might show a side panel with details on selection, 
    // but for now, we'll just handle the highlight.
  };

  // Calculate stats for the dashboard-like view
  const mediaStats = useMemo(() => {
    const total = mediaList.length;
    const images = mediaList.filter((m) => m.mimeType?.startsWith("image/")).length;
    const videos = mediaList.filter((m) => m.mimeType?.startsWith("video/")).length;
    const documents = total - images - videos;
    return { total, images, videos, documents };
  }, [mediaList]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Media Library
      </Typography>

      {/* --- Media Statistics --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <StatCard title="Total Assets" value={mediaStats.total} />
        <StatCard title="Images" value={mediaStats.images} />
        <StatCard title="Videos" value={mediaStats.videos} />
      </Grid>
      
      {/* --- Main Content Tabs --- */}
      <Paper elevation={3}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Browse Library" />
          <Tab label="Upload New Media" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <MediaLibraryView
              mediaList={filteredMedia}
              allTags={allTags}
              isLoading={isLoading}
              error={error}
              selectedMediaId={selectedMediaId}
              handleSelectMedia={handleSelectMedia}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}

          {activeTab === 1 && <UploadView queryClient={queryClient} setActiveTab={setActiveTab} />}
        </Box>
      </Paper>
    </Container>
  );
};

// --- Helper Components ---

// A simple card for displaying stats
const StatCard = ({ title, value }) => (
  <Grid item xs={12} sm={6} md={3}>
    <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
      <Typography variant="h5" color="primary">{value}</Typography>
      <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
    </Paper>
  </Grid>
);

// --- Media Library View Component (Modified) ---
const MediaLibraryView = ({
  mediaList,
  allTags,
  isLoading,
  error,
  selectedMediaId,
  handleSelectMedia,
  selectedTag,
  setSelectedTag,
  searchTerm,
  setSearchTerm,
}) => {
  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error">Error loading media: {error.message || 'Unknown error'}</Typography>;

  return (
    <Box>
      {/* Filters and Search Bar */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <TextField
          label="Search Media (Filename, Title, Tags)"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />

        {allTags.length > 0 && (
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Filter by Tag</InputLabel>
            <Select
              value={selectedTag}
              label="Filter by Tag"
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <MenuItem value="">All Tags</MenuItem>
              {allTags.map((tag) => (
                <MenuItem key={tag} value={tag}>
                  {tag}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {/* Media List Display */}
      {mediaList.length > 0 ? (
        <ImageList cols={5} gap={16}>
          {mediaList.map((media) => (
            <ImageListItem
              key={media._id}
              onClick={() => handleSelectMedia(media)}
              sx={{
                cursor: "pointer",
                border: selectedMediaId === media._id ? "3px solid #1976d2" : "1px solid #ccc",
                borderRadius: 1,
                overflow: "hidden",
                transition: 'border 0.2s',
              }}
            >
              <img
                src={`${import.meta.env.VITE_API_URL}${media.versions.small}`}
                alt={media.altText || media.filename} // Use altText if available
                loading="lazy"
                style={{ objectFit: 'cover', height: '100%' }}
              />
              <ImageListItemBar
                title={media.title || media.filename} // Use title if available
                subtitle={
                  media.tags?.length > 0
                    ? media.tags.map((t) => <Chip key={t} label={t} size="small" sx={{ mr: 0.5, mt: 0.5 }} />)
                    : null
                }
                position="below" // Move info below the image for better visibility
              />
            </ImageListItem>
          ))}
        </ImageList>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          {selectedTag || searchTerm ? "No media found matching the current filter/search criteria." : "No media available in the library."}
        </Typography>
      )}
    </Box>
  );
};

// --- Upload View Component (Enhanced) ---
const UploadView = ({ queryClient, setActiveTab }) => {
  const [uploadData, setUploadData] = useState({
    file: null,
    title: "",
    description: "",
    altText: "",
    tags: [],
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => uploadMedia(data.file, data.tags, data.title, data.description, data.altText),
    onSuccess: (newMedia) => {
      // Add new media to the list without a full refetch
      queryClient.setQueryData(["media"], (old = []) => [newMedia, ...old]);
      resetUploadForm();
      setActiveTab(0); // Switch back to the library view
    },
    onError: (error) => {
      console.error("Upload failed", error);
      alert(`Upload Failed: ${error.message || 'Unknown error'}`);
    }
  });

  const resetUploadForm = () => {
    setUploadData({ file: null, title: "", description: "", altText: "", tags: [] });
    setPreviewUrl(null);
    setUploading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData((prev) => ({ ...prev, file, title: file.name.split('.').slice(0, -1).join('.') }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    const tagsArray = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setUploadData((prev) => ({ ...prev, tags: tagsArray }));
  };

  const handleFileUpload = async () => {
    if (!uploadData.file) return alert("Please select a file first.");

    // Convert tags array to a comma-separated string for the API call
    const tagsString = uploadData.tags.join(",");

    setUploading(true);
    try {
      await mutation.mutateAsync({ 
        file: uploadData.file, 
        tags: tagsString, 
        title: uploadData.title, 
        description: uploadData.description, 
        altText: uploadData.altText 
      });
    } catch (err) {
      // Error handled in mutation.onError
    } finally {
      setUploading(false);
    }
  };

  return (
    <Grid container spacing={4} sx={{ mt: 1 }}>
      <Grid item xs={12} md={6}>
        <Stack spacing={3}>
          {/* File Selection */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            {!uploadData.file ? (
              <Button variant="contained" component="label" fullWidth disabled={uploading}>
                Select Media File
                <input type="file" hidden accept="image/*,video/*" onChange={handleFileSelect} />
              </Button>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>Selected File:</Typography>
                <Paper variant="elevation" sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }} />
                  )}
                  <Box>
                    <Typography variant="body1" fontWeight="bold">{uploadData.file.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      File Size: {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
          </Paper>

          {/* Upload Details */}
          <TextField
            label="Title"
            name="title"
            value={uploadData.title}
            onChange={handleInputChange}
            fullWidth
            size="small"
            required
            disabled={!uploadData.file}
          />
          <TextField
            label="Alt Text (For SEO & Accessibility)"
            name="altText"
            value={uploadData.altText}
            onChange={handleInputChange}
            fullWidth
            size="small"
            helperText="A brief, accurate description of the image content."
            disabled={!uploadData.file}
          />
          <TextField
            label="Description"
            name="description"
            value={uploadData.description}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
            size="small"
            disabled={!uploadData.file}
          />
          <TextField
            label="Tags (comma separated)"
            name="tags"
            value={uploadData.tags.join(", ")}
            onChange={handleTagsChange}
            fullWidth
            size="small"
            disabled={!uploadData.file}
            helperText="e.g., nature, product-photo, landscape"
          />

          {/* Upload Actions */}
          {uploadData.file && (
            <Stack direction="row" spacing={2} pt={1}>
              <Button
                variant="contained"
                onClick={handleFileUpload}
                disabled={uploading || mutation.isLoading || !uploadData.title}
                startIcon={uploading && <CircularProgress size={20} color="inherit" />}
              >
                {uploading ? "Uploading..." : "Upload File"}
              </Button>
              <Button variant="outlined" onClick={resetUploadForm} disabled={uploading}>
                Clear Form
              </Button>
            </Stack>
          )}

          {mutation.isError && (
            <Typography color="error">Upload Error: {mutation.error.message}</Typography>
          )}
        </Stack>
      </Grid>
      
      {/* Preview Column */}
      <Grid item xs={12} md={6}>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Media Metadata Preview</Typography>
          <Typography variant="body2" color="text.secondary">**Title:** {uploadData.title || 'N/A'}</Typography>
          <Typography variant="body2" color="text.secondary">**Alt Text:** {uploadData.altText || 'N/A'}</Typography>
          <Typography variant="body2" color="text.secondary">**Tags:** {uploadData.tags.join(', ') || 'N/A'}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MediaLibraryPage;