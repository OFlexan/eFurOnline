# FUNC: getPollVote
Gets the votes of the poll.  
Input:
1. `p`: poll object ID

# FUNC: getFollowingPostCount
Gets the amount of unread following posts.  

# FUNC: getNotificationCount
Gets the amount of unread notifications.  

# FUNC: countUnreadConversations
Gets the amount of unread chat messages.  
Input:
1. `z`: app version ID

# FUNC: getNewPosts
Gets 8 posts.
Input:
1. (optional) `d`: timestamp of last post

# FUNC: voteOnPoll
Votes on a poll post.
Input:
1. `p`: poll object ID
2. `v`: array of voted indexes

# FUNC: getPollVote
Get votes on a poll post. Returns {} if user hasn't voted.
Input:
1. `p`: poll object ID

# FUNC: getComments
Gets comments on a post.
1. (optional) `c`: comment ID (will get comments targeted at comments)
2. (optional) `d`: timestamp of last comment
3. `p`: post object ID