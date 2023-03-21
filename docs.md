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