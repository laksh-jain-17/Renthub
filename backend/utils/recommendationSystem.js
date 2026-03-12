/**
 * Recommendation System using Collaborative Filtering
 * Inspired by Apriori Algorithm principles
 */

const getItemRecommendations = async (userId, Booking, Item) => {
  try {
    const userBookings = await Booking.find({ renter: userId })
      .populate('item');
    
    if (userBookings.length === 0) {
      const popularItems = await Item.find({ available: true })
        .sort({ rating: -1 })
        .limit(10);
      return popularItems;
    }
    const userCategories = userBookings.map(b => b.item?.category).filter(Boolean);
    const categoryCounts = {};
    
    userCategories.forEach(cat => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const allBookings = await Booking.find({})
      .populate('item');
    
    const userItemMap = {};
    allBookings.forEach(booking => {
      const renterId = booking.renter.toString();
      if (!userItemMap[renterId]) {
        userItemMap[renterId] = [];
      }
      if (booking.item) {
        userItemMap[renterId].push(booking.item.category);
      }
    });

    const similarityScores = {};
    const currentUserCategories = new Set(userCategories);
    
    Object.keys(userItemMap).forEach(otherUserId => {
      if (otherUserId === userId.toString()) return;
      
      const otherUserCategories = new Set(userItemMap[otherUserId]);
      const intersection = new Set(
        [...currentUserCategories].filter(x => otherUserCategories.has(x))
      );
      
      const union = new Set([...currentUserCategories, ...otherUserCategories]);
      const similarity = intersection.size / union.size;
      
      if (similarity > 0) {
        similarityScores[otherUserId] = similarity;
      }
    });
    const similarUsers = Object.entries(similarityScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId]) => userId);

    const recommendedItemIds = new Set();
    const userRentedItemIds = new Set(
      userBookings.map(b => b.item?._id?.toString()).filter(Boolean)
    );

    for (const similarUserId of similarUsers) {
      const similarUserBookings = await Booking.find({ 
        renter: similarUserId 
      }).populate('item');
      
      similarUserBookings.forEach(booking => {
        if (booking.item && !userRentedItemIds.has(booking.item._id.toString())) {
          recommendedItemIds.add(booking.item._id.toString());
        }
      });
    }
    let recommendations = await Item.find({
      _id: { $in: Array.from(recommendedItemIds) },
      available: true
    });

    recommendations = recommendations.sort((a, b) => {
      const aScore = (categoryCounts[a.category] || 0) * 10 + (a.rating || 0);
      const bScore = (categoryCounts[b.category] || 0) * 10 + (b.rating || 0);
      return bScore - aScore;
    });

    if (recommendations.length < 10) {
      const preferredCategories = Object.keys(categoryCounts)
        .sort((a, b) => categoryCounts[b] - categoryCounts[a]);
      
      const additionalItems = await Item.find({
        category: { $in: preferredCategories },
        _id: { 
          $nin: [
            ...userRentedItemIds,
            ...recommendations.map(r => r._id)
          ]
        },
        available: true
      })
        .sort({ rating: -1 })
        .limit(10 - recommendations.length);
      
      recommendations = [...recommendations, ...additionalItems];
    }
    if (recommendations.length < 10) {
      const popularItems = await Item.find({
        _id: { 
          $nin: [
            ...userRentedItemIds,
            ...recommendations.map(r => r._id)
          ]
        },
        available: true
      })
        .sort({ rating: -1 })
        .limit(10 - recommendations.length);
      
      recommendations = [...recommendations, ...popularItems];
    }

    return recommendations.slice(0, 10);
  } catch (error) {
    console.error('Recommendation error:', error);
    const popularItems = await Item.find({ available: true })
      .sort({ rating: -1 })
      .limit(10);
    return popularItems;
  }
};

const getFrequentItemPatterns = async (Booking, minSupport = 0.1) => {
  try {
    const allBookings = await Booking.find({}).populate('item');
    const userTransactions = {};
    allBookings.forEach(booking => {
      const userId = booking.renter.toString();
      if (!userTransactions[userId]) {
        userTransactions[userId] = [];
      }
      if (booking.item) {
        userTransactions[userId].push(booking.item.category);
      }
    });

    const transactions = Object.values(userTransactions);
    const totalTransactions = transactions.length;

    const itemCounts = {};
    transactions.forEach(transaction => {
      const uniqueItems = [...new Set(transaction)];
      uniqueItems.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });
    });

    const frequentItems = Object.entries(itemCounts)
      .filter(([item, count]) => count / totalTransactions >= minSupport)
      .map(([item, count]) => ({
        items: [item],
        support: count / totalTransactions,
        count
      }));

    const pairCounts = {};
    transactions.forEach(transaction => {
      const uniqueItems = [...new Set(transaction)];
      for (let i = 0; i < uniqueItems.length; i++) {
        for (let j = i + 1; j < uniqueItems.length; j++) {
          const pair = [uniqueItems[i], uniqueItems[j]].sort().join(',');
          pairCounts[pair] = (pairCounts[pair] || 0) + 1;
        }
      }
    });

    const frequentPairs = Object.entries(pairCounts)
      .filter(([pair, count]) => count / totalTransactions >= minSupport)
      .map(([pair, count]) => ({
        items: pair.split(','),
        support: count / totalTransactions,
        count
      }));

    return {
      frequentItems: frequentItems.sort((a, b) => b.support - a.support),
      frequentPairs: frequentPairs.sort((a, b) => b.support - a.support)
    };
  } catch (error) {
    console.error('Pattern mining error:', error);
    return { frequentItems: [], frequentPairs: [] };
  }
};

module.exports = {
  getItemRecommendations,
  getFrequentItemPatterns
};