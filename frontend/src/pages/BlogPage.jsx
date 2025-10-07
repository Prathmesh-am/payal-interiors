import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Pagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchBlogs } from '../services/blogService';
import { fetchCategories } from '../services/blogService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteBlog } from '../services/blogService'; // Import the existing deleteBlog function

const MOCK_STATUSES = ['published', 'draft'];

const BlogDashboard = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  const queryClient = useQueryClient();

  // 1. Fetch Blogs Data
  const { data: blogData, isLoading: isBlogsLoading, isError: isBlogsError } = useQuery({
    queryKey: ['blogs', page, limit, searchTerm, category, status, sort],
    queryFn: () => fetchBlogs(page, limit, { searchTerm, category, status, sort }),
    keepPreviousData: true,
  });

  // 2. Fetch Categories Data
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    select: (data) => data.map(c => c.name),
  });

  // 3. Delete Blog Mutation
  const deleteMutation = useMutation({
    mutationFn: (slug) => deleteBlog(slug), // Use the existing deleteBlog function from blogService
    onSuccess: () => {
      queryClient.invalidateQueries(['blogs']); // Refresh the blog list
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting blog:', error);
    },
  });

  const { blogs = [], pagination = {} } = blogData || {};
  const { totalPages = 1, currentPage = 1, totalItems = 0 } = pagination;

  const handleCreateBlog = () => {
    navigate('/create-blog');
  };

  const handleEditBlog = (slug) => {
    navigate(`/edit-blog/${slug}`);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleDeleteClick = (blog) => {
    setBlogToDelete(blog);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (blogToDelete) {
      deleteMutation.mutate(blogToDelete.slug);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBlogToDelete(null);
  };

  // Function to get image URL with fallback
  const getImageUrl = (blog) => {
    if (blog.featuredImage?.versions?.thumbnail) {
      return `${import.meta.env.VITE_API_URL}${blog.featuredImage.versions?.thumbnail}`;
    }
    return null;
  };

  if (isBlogsLoading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading blog data...</Typography>
      </Container>
    );
  }

  if (isBlogsError) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Error loading blogs. Please try again.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 1. Header and Primary Action */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Blog Dashboard 📝 ({totalItems} Total)
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateBlog}>
          Create New Post
        </Button>
      </Box>

      {/* 2. Search and Filter Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">

          {/* Search Field - Width reduced from md={3} to md={2} */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search by Title"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>

          {/* Category Filter - Width increased from md={2} to md={3} */}
          <Grid item xs={6} sm={3} md={3}>
            <FormControl fullWidth disabled={isCategoriesLoading}>
              <InputLabel>Category</InputLabel>
              <Select
                sx={{ width: 200 }}
                value={category}
                label="Category"
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
                {isCategoriesLoading && <MenuItem disabled><CircularProgress size={20} /></MenuItem>}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter - Width increased from md={2} to md={3} */}
          <Grid item xs={6} sm={3} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                sx={{ width: 200 }}
                value={status}
                label="Status"
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {MOCK_STATUSES.map((stat) => (
                  <MenuItem key={stat} value={stat}>
                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sort By - Unchanged at md={2} */}
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sort}
                label="Sort By"
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="title_asc">Title (A-Z)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Clear Filters Button - Width reduced from md={3} to md={2} */}
          <Grid item xs={6} sm={3} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setCategory('');
                setStatus('');
                setSort('newest');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ mr: 1, my: 'auto' }}>
            Active Filters:
          </Typography>
          {category && <Chip label={`Category: ${category}`} onDelete={() => setCategory('')} />}
          {status && <Chip label={`Status: ${status}`} onDelete={() => setStatus('')} />}
          {searchTerm && <Chip label={`Search: "${searchTerm}"`} onDelete={() => setSearchTerm('')} />}
          {!category && !status && !searchTerm && <Typography variant="body2" color="text.secondary">None</Typography>}
        </Stack>
      </Paper>

      {/* 3. Blog List (Table Format) */}
      <Paper elevation={2} sx={{ overflow: 'hidden' }}>
        {blogs.length > 0 ? (
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: 'grey.100' } }}>
                  <TableCell>Image</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blogs.map((blog) => (
                  <TableRow
                    key={blog._id}
                    hover
                    sx={{ cursor: "pointer", "& td": { py: 1.5, height: "80px" } }}
                    onClick={() => navigate(`/blog/${blog.slug}`)} // Navigate on click
                  >
                    {/* Image Cell */}
                    <TableCell>
                      <Avatar
                        src={getImageUrl(blog)}
                        alt={blog.title}
                        variant="rounded"
                        sx={{ width: 60, height: 60 }}
                      >
                        <ImageIcon />
                      </Avatar>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {blog.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Category: {blog.categories[0]?.name || "Uncategorized"} | Slug: {blog.slug}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={blog.status}
                        color={
                          blog.status === "published"
                            ? "success"
                            : blog.status === "draft"
                              ? "warning"
                              : "default"
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleEditBlog(blog.slug);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleDeleteClick(blog);
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <Typography variant="h5" color="text.secondary">
              No blogs found matching your criteria. 😟
            </Typography>
            <Typography variant="body1" color="text.hint" sx={{ mt: 1 }}>
              Try clearing some filters or checking your backend status.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 4. Pagination Controls */}
      {totalPages > 1 && (
        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            variant="outlined"
            shape="rounded"
          />
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the blog "{blogToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BlogDashboard;