var PinTuanData = (function() {
  var DEFAULT_PRODUCTS = [
    {
      id: 1,
      name: '草莓蛋糕（6寸）',
      emoji: '🍓',
      originalPrice: 89,
      groupPrice: 59,
      groupSize: 2,
      leaderTime: 2,
      sales: 1256,
      description: '新鲜草莓搭配绵密奶油，每一口都是幸福的味道'
    },
    {
      id: 2,
      name: '精品咖啡豆礼盒',
      emoji: '☕',
      originalPrice: 128,
      groupPrice: 79,
      groupSize: 3,
      leaderTime: 3,
      sales: 892,
      description: '精选阿拉比卡咖啡豆，现烘现磨，香气浓郁'
    },
    {
      id: 3,
      name: '护手霜套装（3支）',
      emoji: '🧴',
      originalPrice: 99,
      groupPrice: 49,
      groupSize: 2,
      leaderTime: 2,
      sales: 2341,
      description: '滋润不油腻，秋冬必备护手神器'
    },
    {
      id: 4,
      name: '无线蓝牙耳机',
      emoji: '🎧',
      originalPrice: 199,
      groupPrice: 129,
      groupSize: 3,
      leaderTime: 4,
      sales: 5678,
      description: '主动降噪，超长续航，音质出众'
    },
    {
      id: 5,
      name: '畅销书套装（5本）',
      emoji: '📚',
      originalPrice: 158,
      groupPrice: 89,
      groupSize: 2,
      leaderTime: 3,
      sales: 1023,
      description: '精选畅销好书，提升自我从阅读开始'
    },
    {
      id: 6,
      name: '1.2米毛绒熊',
      emoji: '🧸',
      originalPrice: 168,
      groupPrice: 99,
      groupSize: 3,
      leaderTime: 6,
      sales: 756,
      description: '超柔软毛绒，陪伴你每一个温馨时刻'
    },
    {
      id: 7,
      name: '红酒礼盒（2瓶）',
      emoji: '🍷',
      originalPrice: 258,
      groupPrice: 158,
      groupSize: 2,
      leaderTime: 4,
      sales: 432,
      description: '法国进口红酒，送礼自饮两相宜'
    },
    {
      id: 8,
      name: '游戏手柄',
      emoji: '🎮',
      originalPrice: 299,
      groupPrice: 199,
      groupSize: 3,
      leaderTime: 5,
      sales: 3210,
      description: '蓝牙无线连接，精准操控，畅玩游戏'
    }
  ];

  var RANDOM_AVATARS = ['😀', '😎', '🤗', '🥳', '😊', '🤩', '😇', '🙂', '😋', '🤓', '😺', '🐱', '🐶', '🐼', '🦊', '🐨'];
  var RANDOM_NAMES = ['小明', '阿杰', '花花', '大伟', '小美', '阿强', '晓晓', '大鹏', '小雪', '阿豪', '甜甜', '大壮', '乐乐', '阿勇', '贝贝', '阿龙'];

  function getRandomAvatar() {
    return RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)];
  }

  function getRandomName() {
    return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  }

  function generateGroupId() {
    return 'G' + Date.now() + Math.floor(Math.random() * 1000);
  }

  function getProducts() {
    var products = PinTuanStorage.get('products');
    if (!products || !Array.isArray(products) || products.length === 0) {
      products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      PinTuanStorage.set('products', products);
    }
    return products;
  }

  function resetProducts() {
    var defaultProducts = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    PinTuanStorage.set('products', defaultProducts);
    return defaultProducts;
  }

  function getGroups() {
    var groups = PinTuanStorage.get('groups');
    if (!groups) {
      groups = [];
    }
    return groups;
  }

  function saveGroups(groups) {
    PinTuanStorage.set('groups', groups);
  }

  function getMyGroups() {
    var myGroups = PinTuanStorage.get('myGroups');
    if (!myGroups) {
      myGroups = { created: [], joined: [] };
    }
    return myGroups;
  }

  function saveMyGroups(myGroups) {
    PinTuanStorage.set('myGroups', myGroups);
  }

  function createGroup(productId, leaderName, leaderAvatar) {
    var products = getProducts();
    var product = products.find(function(p) { return p.id === productId; });
    if (!product) return null;

    var group = {
      id: generateGroupId(),
      productId: productId,
      productName: product.name,
      productEmoji: product.emoji,
      groupPrice: product.groupPrice,
      groupSize: product.groupSize,
      leaderTime: product.leaderTime,
      leader: {
        name: leaderName || '我',
        avatar: leaderAvatar || '😀',
        isLeader: true
      },
      members: [{
        name: leaderName || '我',
        avatar: leaderAvatar || '😀',
        isLeader: true
      }],
      status: 'ongoing',
      createTime: Date.now(),
      expireTime: Date.now() + product.leaderTime * 60 * 60 * 1000
    };

    var groups = getGroups();
    groups.push(group);
    saveGroups(groups);

    var myGroups = getMyGroups();
    myGroups.created.push(group.id);
    saveMyGroups(myGroups);

    return group;
  }

  function joinGroup(groupId, memberName, memberAvatar) {
    var groups = getGroups();
    var group = groups.find(function(g) { return g.id === groupId; });
    if (!group || group.status !== 'ongoing') return null;

    if (group.members.length >= group.groupSize) return null;

    group.members.push({
      name: memberName || '我',
      avatar: memberAvatar || getRandomAvatar(),
      isLeader: false
    });

    if (group.members.length >= group.groupSize) {
      group.status = 'success';
    }

    saveGroups(groups);

    var myGroups = getMyGroups();
    if (myGroups.created.indexOf(groupId) === -1 && myGroups.joined.indexOf(groupId) === -1) {
      myGroups.joined.push(groupId);
    }
    saveMyGroups(myGroups);

    return group;
  }

  function getGroupById(groupId) {
    var groups = getGroups();
    return groups.find(function(g) { return g.id === groupId; });
  }

  function getProductById(productId) {
    var products = getProducts();
    return products.find(function(p) { return p.id === productId; });
  }

  function updateGroupStatus() {
    var groups = getGroups();
    var now = Date.now();
    var changed = false;

    groups.forEach(function(group) {
      if (group.status === 'ongoing' && now >= group.expireTime) {
        group.status = 'failed';
        changed = true;
      }
    });

    if (changed) {
      saveGroups(groups);
    }
    return groups;
  }

  function clearAllGroups() {
    saveGroups([]);
    saveMyGroups({ created: [], joined: [] });
  }

  function generateTestData() {
    clearAllGroups();
    var groups = [];
    var myGroups = { created: [], joined: [] };

    var products = getProducts();

    var group1 = {
      id: generateGroupId(),
      productId: 1,
      productName: products[0].name,
      productEmoji: products[0].emoji,
      groupPrice: products[0].groupPrice,
      groupSize: products[0].groupSize,
      leaderTime: products[0].leaderTime,
      leader: { name: '小红', avatar: '🥰', isLeader: true },
      members: [
        { name: '小红', avatar: '🥰', isLeader: true }
      ],
      status: 'ongoing',
      createTime: Date.now(),
      expireTime: Date.now() + 60 * 60 * 1000
    };
    groups.push(group1);

    var group2 = {
      id: generateGroupId(),
      productId: 4,
      productName: products[3].name,
      productEmoji: products[3].emoji,
      groupPrice: products[3].groupPrice,
      groupSize: products[3].groupSize,
      leaderTime: products[3].leaderTime,
      leader: { name: '阿杰', avatar: '😎', isLeader: true },
      members: [
        { name: '阿杰', avatar: '😎', isLeader: true },
        { name: '小明', avatar: '😀', isLeader: false }
      ],
      status: 'ongoing',
      createTime: Date.now(),
      expireTime: Date.now() + 2 * 60 * 60 * 1000
    };
    groups.push(group2);

    var group3 = {
      id: generateGroupId(),
      productId: 6,
      productName: products[5].name,
      productEmoji: products[5].emoji,
      groupPrice: products[5].groupPrice,
      groupSize: products[5].groupSize,
      leaderTime: products[5].leaderTime,
      leader: { name: '花花', avatar: '🌸', isLeader: true },
      members: [
        { name: '花花', avatar: '🌸', isLeader: true },
        { name: '小美', avatar: '🌷', isLeader: false },
        { name: '晓晓', avatar: '🌺', isLeader: false }
      ],
      status: 'success',
      createTime: Date.now() - 2 * 60 * 60 * 1000,
      expireTime: Date.now() + 4 * 60 * 60 * 1000
    };
    groups.push(group3);
    myGroups.joined.push(group3.id);

    var group4 = {
      id: generateGroupId(),
      productId: 3,
      productName: products[2].name,
      productEmoji: products[2].emoji,
      groupPrice: products[2].groupPrice,
      groupSize: products[2].groupSize,
      leaderTime: products[2].leaderTime,
      leader: { name: '大伟', avatar: '💪', isLeader: true },
      members: [
        { name: '大伟', avatar: '💪', isLeader: true }
      ],
      status: 'failed',
      createTime: Date.now() - 3 * 60 * 60 * 1000,
      expireTime: Date.now() - 1 * 60 * 60 * 1000
    };
    groups.push(group4);

    var group5 = {
      id: generateGroupId(),
      productId: 2,
      productName: products[1].name,
      productEmoji: products[1].emoji,
      groupPrice: products[1].groupPrice,
      groupSize: products[1].groupSize,
      leaderTime: products[1].leaderTime,
      leader: { name: '我', avatar: '😊', isLeader: true },
      members: [
        { name: '我', avatar: '😊', isLeader: true },
        { name: '阿强', avatar: '😺', isLeader: false }
      ],
      status: 'ongoing',
      createTime: Date.now(),
      expireTime: Date.now() + 30 * 60 * 1000
    };
    groups.push(group5);
    myGroups.created.push(group5.id);

    saveGroups(groups);
    saveMyGroups(myGroups);
    return groups;
  }

  function getProductGroupStatus(productId) {
    var groups = getGroups();
    var productGroups = groups.filter(function(g) {
      return g.productId === productId && g.status === 'ongoing';
    });

    var totalMembers = productGroups.reduce(function(sum, g) {
      return sum + g.members.length;
    }, 0);

    var nearlyFull = productGroups.filter(function(g) {
      return g.members.length === g.groupSize - 1;
    });

    return {
      totalGroups: productGroups.length,
      totalMembers: totalMembers,
      nearlyFullCount: nearlyFull.length,
      hasAvailable: productGroups.length > 0
    };
  }

  return {
    DEFAULT_PRODUCTS: DEFAULT_PRODUCTS,
    getProducts: getProducts,
    resetProducts: resetProducts,
    getGroups: getGroups,
    saveGroups: saveGroups,
    getMyGroups: getMyGroups,
    saveMyGroups: saveMyGroups,
    createGroup: createGroup,
    joinGroup: joinGroup,
    getGroupById: getGroupById,
    getProductById: getProductById,
    updateGroupStatus: updateGroupStatus,
    clearAllGroups: clearAllGroups,
    generateTestData: generateTestData,
    getProductGroupStatus: getProductGroupStatus,
    getRandomAvatar: getRandomAvatar,
    getRandomName: getRandomName
  };
})();
