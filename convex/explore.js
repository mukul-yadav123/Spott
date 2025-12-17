import { v } from "convex/values";
import { query } from "./_generated/server";


// get featured events
export const getFeaturedEvents = query({
    args: {
        limit: v.optional(v.number())
    },
    handler: async (ctx,args) => {
        const now = Date.now();

        const events = await ctx.db.query("events")
        .withIndex("by_start_date")
        .filter((q) => q.gte(q.field("startDate"),now))
        .order("desc")
        .collect()

        const featured = events
        .sort((a,b) => b.registrationCount - a.registrationCount)
        .slice(0,args.limit ?? 3);

        return featured;
    }
})


// get event by location
export const getEventsByLocation = query({
    args: {
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async(ctx,args) => {
        const now = Date.now();

        let events = await ctx.db.query("events")
        .withIndex("by_start_date")
        .filter((q) => q.gte(q.field("startDate"),now))
        .collect();

        if(args.city)
        {
            events = events.filter(
                (e) => e.city.toLowerCase() === args.city.toLowerCase()
            )
        }else if(args.state)
        {
            events = events.filter(
                (e) => e.state.toLowerCase() === args.state.toLowerCase()
            )
        }

        // Get current user's interests to personalize sorting
        const identity = await ctx.auth.getUserIdentity();
        let userInterests = [];

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) =>
                    q.eq("tokenIdentifier", identity.tokenIdentifier)
                )
                .unique();

            if (user?.interests) {
                userInterests = user.interests;
            }
        }

        // Sort events based on user interests
        if (userInterests.length > 0) {
            events.sort((a, b) => {
                const aInInterests = userInterests.includes(a.category);
                const bInInterests = userInterests.includes(b.category);

                // If both are in interests or both are not, maintain date order
                if (aInInterests === bInInterests) {
                    // If both are in interests, sort by interest order
                    if (aInInterests) {
                        return userInterests.indexOf(a.category) - userInterests.indexOf(b.category);
                    }
                    return 0;
                }

                // Events matching user interests come first
                return aInInterests ? -1 : 1;
            });
        }

        return events.slice(0,args.limit ?? 4)
    }
})

// get popular events

export const getPopularEvents = query({
    args:{
        limit: v.optional(v.number())
    },
    handler: async(ctx,args) => {
        const now = Date.now();

        const events = await ctx.db.query("events")
        .withIndex("by_start_date")
        .filter((q) => q.gte(q.field("startDate"),now))
        .collect();

        const popular = events
        .sort((a,b) => b.registrationCount - a.registrationCount)
        .slice(0,args.limit ?? 6);

        // Get current user's interests to personalize sorting
        const identity = await ctx.auth.getUserIdentity();
        let userInterests = [];

        if (identity) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_token", (q) =>
                    q.eq("tokenIdentifier", identity.tokenIdentifier)
                )
                .unique();

            if (user?.interests) {
                userInterests = user.interests;
            }
        }

        // Sort events based on user interests
        if (userInterests.length > 0) {
            popular.sort((a, b) => {
                const aInInterests = userInterests.includes(a.category);
                const bInInterests = userInterests.includes(b.category);

                // If both are in interests or both are not, maintain date order
                if (aInInterests === bInInterests) {
                    // If both are in interests, sort by interest order
                    if (aInInterests) {
                        return userInterests.indexOf(a.category) - userInterests.indexOf(b.category);
                    }
                    return 0;
                }

                // Events matching user interests come first
                return aInInterests ? -1 : 1;
            });
        }

        return popular

    }
})


// get events by category
export const getEventsByCategory = query({
    args:{
        category: v.string(),
        limit: v.optional(v.number())
    },
    handler: async(ctx,args) => {
        const now = Date.now();

        const events = await ctx.db.query("events")
        .withIndex("by_category",(q) => q.eq("category",args.category))
        .filter((q) => q.gte(q.field("startDate"),now))
        .collect();

        return events.slice(0,args.limit ?? 12)

    }
})

// get category counts

export const getCategoryCounts = query({
    handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
        .query("events")
        .withIndex("by_start_date")
        .filter((q) => q.gte(q.field("startDate",now)))
        .collect();

    const counts = {};
    events.forEach((event) => {
        counts[event.category] = (counts[event.category] || 0) + 1;
    })
    return counts;
    
    }
}) 