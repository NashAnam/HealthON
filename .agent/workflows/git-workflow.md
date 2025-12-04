---
description: Git workflow for CareOn project
---

# Git Workflow for CareOn

## Common Git Commands

### 1. Check Current Status
```bash
git status
```
Shows modified files, staged changes, and current branch.

### 2. View All Branches
```bash
# Local branches
git branch

# All branches (including remote)
git branch -a
```

### 3. Fetch Latest Changes
// turbo
```bash
git fetch --all
```
Downloads all changes from remote without merging.

### 4. Create a New Branch
```bash
git checkout -b branch-name
```
Creates and switches to a new branch.

### 5. Switch Between Branches
```bash
git checkout branch-name
```

### 6. Stage Changes
```bash
# Stage specific files
git add file1.js file2.js

# Stage all changes
git add .
```

### 7. Commit Changes
```bash
git commit -m "Your descriptive commit message"
```

### 8. Push Changes to Remote
```bash
# Push to current branch
git push

# Push new branch to remote
git push -u origin branch-name

# Force push (use with caution!)
git push --force
```

### 9. Pull Latest Changes
```bash
# Pull from current branch
git pull

# Pull from specific branch
git pull origin branch-name
```

### 10. Merge Branches
```bash
# Switch to target branch (e.g., master)
git checkout master

# Merge another branch into current branch
git merge branch-name

# Merge with commit message
git merge branch-name --no-ff -m "Merge message"
```

### 11. View Commit History
```bash
# Detailed history
git log

# Compact history (last 10 commits)
git log --oneline -10

# History of specific branch
git log origin/branch-name --oneline -10
```

### 12. View Changes Between Branches
```bash
# See file statistics
git diff master origin/branch-name --stat

# See detailed changes
git diff master origin/branch-name

# See changes in specific files
git diff master origin/branch-name -- file1.js file2.js
```

### 13. Discard Local Changes
```bash
# Discard changes in specific file
git restore file.js

# Discard all changes
git restore .

# Remove untracked files
git clean -fd
```

### 14. Delete Branches
```bash
# Delete local branch
git branch -d branch-name

# Force delete local branch
git branch -D branch-name

# Delete remote branch
git push origin --delete branch-name
```

### 15. Stash Changes (Temporary Save)
```bash
# Save current changes
git stash

# List stashes
git stash list

# Apply latest stash
git stash pop

# Apply specific stash
git stash apply stash@{0}
```

## Typical Workflow

### Working on a New Feature
1. Create a new branch: `git checkout -b feature-name`
2. Make your changes
3. Stage changes: `git add .`
4. Commit: `git commit -m "Add feature description"`
5. Push to remote: `git push -u origin feature-name`
6. Create pull request on GitHub (or merge locally)

### Merging Feature into Master
1. Fetch latest: `git fetch --all`
2. Switch to master: `git checkout master`
3. Pull latest master: `git pull origin master`
4. Merge feature: `git merge feature-name --no-ff -m "Merge feature-name"`
5. Push to remote: `git push origin master`

### Quick Fixes on Master
1. Make changes
2. Stage: `git add .`
3. Commit: `git commit -m "Fix: description"`
4. Push: `git push origin master`

## Best Practices

1. **Commit Often**: Make small, focused commits
2. **Descriptive Messages**: Write clear commit messages
3. **Pull Before Push**: Always pull latest changes before pushing
4. **Branch Naming**: Use descriptive names (e.g., `fix-login-bug`, `feature-payment-system`)
5. **Review Changes**: Use `git diff` before committing
6. **Don't Force Push**: Avoid `--force` unless absolutely necessary
7. **Keep Master Clean**: Test thoroughly before merging to master

## Emergency Commands

### Undo Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)
```bash
git reset --hard HEAD~1
```

### Revert a Pushed Commit
```bash
git revert commit-hash
git push
```

### Reset to Remote State
```bash
git fetch origin
git reset --hard origin/master
```
