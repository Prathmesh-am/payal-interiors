import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogById } from "../services/blogService";
import { Box, CircularProgress, Typography, Chip, Paper } from "@mui/material";

const BlogDisplayPage = () => {
  const { slug } = useParams(); 

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => fetchBlogById(slug),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  if (isLoading) return <CircularProgress sx={{ mt: 4 }} />;
  if (error) return <Typography color="error">Failed to load blog</Typography>;
  if (!blog) return <Typography>No blog found.</Typography>;
console.log(blog);

  return (
    <Box sx={{ maxWidth: "900px", mx: "auto", mt: 4, px: 2 }}>
      {/* Blog Title */}
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
        {blog.title}
      </Typography>

      {/* Categories */}
      {blog.categories?.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {blog.categories.map((cat) => (
            <Chip key={cat._id} label={cat.name} sx={{ mr: 1 }} />
          ))}
        </Box>
      )}

      {/* Featured Image */}
      {blog.featuredImage?.versions?.medium && (
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <img
            src={`${import.meta.env.VITE_API_URL}${blog.featuredImage.versions.large}`}
            alt={blog.title}
            style={{
              maxWidth: "100%", // Ensures image scales down to container width
              width: "auto", // Allows natural width if smaller than container
              height: "auto", // Maintains aspect ratio
              maxHeight: "400px", // Keeps a reasonable max height
              objectFit: "cover", // Crops to cover the area
              borderRadius: 8,
              display: "block", // Ensures centering works
              margin: "0 auto", // Centers the image
            }}
          />
        </Box>
      )}

      {/* Excerpt */}
      {blog.excerpt && (
        <Typography variant="subtitle1" sx={{ mb: 2, fontStyle: "italic" }}>
          {blog.excerpt}
        </Typography>
      )}

      {/* Tags */}
      {blog.tags?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {blog.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" sx={{ mr: 1 }} />
          ))}
        </Box>
      )}

      {/* Blog Content */}
      <Paper sx={{ p: 3 }}>
        <div
          dangerouslySetInnerHTML={{ __html: blog.content }}
          style={{ wordBreak: "break-word" }}
        />
      </Paper>
    </Box>
  );
};

export default BlogDisplayPage;