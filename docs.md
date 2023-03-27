# ERRORS
- `{code: 141, error: "no"}`  
My favorite error. It usually has to do with leaving out the app version ID (parameter `z`).
- `{code: 141, error: "Text or title required!"}`  
The content and title are empty. Related to creating posts.
- `{code: 141, error: "You can't reply to deleted comments!"}`
Yes, I tried replying to a deleted comment. Luckily you can't, however you can still like deleted comments.
- `{code: 142, error: "Incorrect text data"}`  
The content or title is not long enough. Related to creating posts.
- `{code: 142, error: "Categories are wrong"}`  
The array of categories is empty or has more than 3 entries. Related to creating posts.

# FUNC: getFollowingPostCount
Gets the amount of unread following posts.

# FUNC: getNotificationCount
Gets the amount of unread notifications.

# FUNC: countUnreadConversations
Gets the amount of unread chat messages.
1. `z`: app version ID

# FUNC: getNewPosts
Gets 8 posts.
1. (optional) `d`: timestamp of last post

# FUNC: voteOnPoll
Votes on a poll post.
1. `p`: poll object ID
2. `v`: array of voted indexes

# FUNC: getPollVote
Get votes on a poll post. Returns {} if user hasn't voted.
1. `p`: poll object ID

# FUNC: getComments
Gets comments on a post.
1. (optional) `c`: comment ID (will get comments targeted at comments)
2. (optional) `d`: timestamp of last comment
3. `p`: post object ID

# FUNC: getPostsInCategory
Gets 8 posts belonging in that category.
1. (optional) `d`: timestamp of last post
2. `t`: category ID

# FUNC: favPost
Favorites or unfavorites a post.
1. `a`: `true` to favorite, `false` to unfavorite
2. `p`: post object ID
3. `z`: app version ID

# FUNC: favComment
Likes or unlikes a comment.
1. `a`: `true` to like, `false` to unlike
2. `c`: comment object ID
3. `z`: app version ID

# FUNC: createPost2 (Story, u = 1)
Creates a story post.
1. `c`: array of category indexes (can not be empty)
2. (optional) `e`: original artist / copyright
3. (optional) `f`: title
4. (optional) `g`: content
5. (optional) `i`: description
6. `r`: rating, 0 = SAFE, 1 = SUGGESTIVE, 2 = EXPLICIT
7. (optional) `s`: link to source
8. `t`: array of tag strings (or an empty array)
9. `u`: 1 (for story post)
10. (optional) `x`: wether to hide the post from new
11. `z`: app version ID

# FUNC: createPost2 (Image/GIF, u = 0)
Creates an image post.
1. `c`: array of category indexes (can not be empty)
2. (optional) `e`: original artist / copyright
3. (optional) `f`: title
4. (optional) `g`: content
5. (optional) `i`: description
6. `r`: rating, 0 = SAFE, 1 = SUGGESTIVE, 2 = EXPLICIT
7. (optional) `s`: link to source
8. `t`: array of tag strings (or an empty array)
9. `u`: 1 (for story post)
10. (optional) `x`: wether to hide the post from new
11. (optional) `a`: image width
12. (optional) `b`: image height
13. `h`: a JSON structure, along the lines of:
```
{
    "__type": "File",
    "name": fileName,
    "url": fileUrl
}
```
14. `l`: wether to prevent downloads
15. `z`: app version ID

# FUNC: deletePost
Deletes a post.
1. `p`: post object ID

# FUNC: getQuota
Gets the quota.

# FUNC: createComment
Comments on a post.
1. `p`: post object ID
2. `t`: comment text
3. (optional) `c`: replies to a top level comment
4. (optional) `r`: replies to a bottom level comment (must still include the `c` parameter)

# IMG UPLOAD
Use Parse SDK to upload an image with filename `{app version ID}_{profile object ID}.jpg`.  
It will respond with a name and a URL which can be used in the function `createPost2 (Image/GIF, u = 0)` as the parameter `h`.