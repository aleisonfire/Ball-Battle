# Development Notes

## Best Practices for Ball Battle Development

### Make One Testable Change at a Time

**IMPORTANT REMINDER:** Always make only one testable change at a time before proceeding to the next goal. This approach helps prevent complex bugs that require multiple corrections to solve.

### Development Workflow

1. **Plan the Change**: Clearly define what single feature or fix you're implementing
2. **Implement**: Make the minimal necessary changes to implement that single feature
3. **Test Thoroughly**: Verify the change works as expected before moving on
4. **Document**: Add comments and update documentation about what changed and why
5. **Commit**: Create a focused commit with a descriptive message

### Benefits of Incremental Development

- Easier to identify the source of bugs
- Simpler to revert problematic changes
- More maintainable codebase
- Clearer development history
- Reduced debugging time

### Example

Instead of:
```
// DON'T DO THIS
- Add player movement
- Add ball physics
- Add collision detection
- Add scoring system
```

Do this:
```
// DO THIS INSTEAD
- Add basic player movement and test
- Add simple ball physics and test
- Add player-ball collision and test
- Add wall-ball collision and test
- Add scoring system and test
```

Remember: Small, testable changes lead to a more stable and maintainable game!

### Coding Pattern Preferences

- Always prefer simple solutions
- Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality
- Write code that takes into account the different environments: dev, test, and prod
- You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested
- When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. And if you finally do this, make sure to remove the old implementation afterwards so we don't have duplicate logic
- Keep the codebase very clean and organized
- Avoid writing scripts in files if possible, especially if the script is likely only to be run once
- Avoid having files over 200-300 lines of code. Refactor at that point
- Mocking data is only needed for tests, never mock data for dev or prod
- Never add stubbing or fake data patterns to code that affects the dev or prod environments
- Never overwrite .env file without first asking and confirming

### Breaking Down Complex Requests

**IMPORTANT PROCESS:** When faced with a complex request that requires multiple steps:

1. **Identify Multi-Step Tasks**: Recognize when a request involves multiple changes or features
2. **Document Each Step**: Break down the request into small, manageable steps
3. **Present Steps for Approval**: Share the breakdown with the requester for confirmation before proceeding
4. **Implement Sequentially**: Complete one step at a time, with testing between each step
5. **Track Progress**: Keep the requester informed about which step is being implemented

Example workflow:
```
// When receiving a complex request
1. "This request involves multiple changes. I'll break it down into steps:"
2. "Step 1: [First specific task]"
3. "Step 2: [Second specific task]"
4. "..."
5. "Would you like me to proceed with these steps in this order?"
```

This approach ensures clarity, maintains code quality, and prevents introducing complex bugs that span multiple changes.