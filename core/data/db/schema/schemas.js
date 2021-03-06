export const posts = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  uuid: {
    type: "string",
    maxlength: 36,
    nullable: false,
    validations: { isUUID: true },
  },
  title: {
    type: "string",
    maxlength: 2000,
    nullable: false,
    validations: { isLength: { max: 255 } },
  },
  slug: { type: "string", maxlength: 191, nullable: false },

  html: {
    type: "text",
    maxlength: 1000000000,
    fieldtype: "long",
    nullable: true,
  },
  comment_id: { type: "string", maxlength: 50, nullable: true },
  plaintext: {
    type: "text",
    maxlength: 1000000000,
    fieldtype: "long",
    nullable: true,
  },
  feature_image: { type: "string", maxlength: 2000, nullable: true },
  featured: { type: "bool", nullable: false, defaultTo: false },
  type: {
    type: "string",
    maxlength: 50,
    nullable: false,
    defaultTo: "post",
    validations: { isIn: [["post", "page"]] },
  },
  status: {
    type: "string",
    maxlength: 50,
    nullable: false,
    defaultTo: "draft",
  },

  visibility: {
    type: "string",
    maxlength: 50,
    nullable: false,
    defaultTo: "public",
  },


  author_id: { type: "string", maxlength: 24, nullable: false },
  created_at: { type: "dateTime", nullable: false },

  created_by: { type: "string", maxlength: 24, nullable: false },
  updated_at: { type: "dateTime", nullable: true },
  updated_by: { type: "string", maxlength: 24, nullable: true },
  published_at: { type: "dateTime", nullable: true },
  published_by: { type: "string", maxlength: 24, nullable: true },

  "@@UNIQUE_CONSTRAINTS@@": [["slug", "type"]],
};

export const posts_meta = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  post_id: {
    type: "string",
    maxlength: 24,
    nullable: false,
    references: "posts.id",
    unique: true,
  },
  og_image: { type: "string", maxlength: 2000, nullable: true },
  og_title: { type: "string", maxlength: 300, nullable: true },
  og_description: { type: "string", maxlength: 500, nullable: true },
  twitter_image: { type: "string", maxlength: 2000, nullable: true },
  twitter_title: { type: "string", maxlength: 300, nullable: true },
  twitter_description: { type: "string", maxlength: 500, nullable: true },
  meta_title: {
    type: "string",
    maxlength: 2000,
    nullable: true,
    validations: { isLength: { max: 300 } },
  },
  meta_description: {
    type: "string",
    maxlength: 2000,
    nullable: true,
    validations: { isLength: { max: 500 } },
  },
  email_subject: { type: "string", maxlength: 300, nullable: true },
  frontmatter: { type: "text", maxlength: 65535, nullable: true },
  feature_image_alt: {
    type: "string",
    maxlength: 191,
    nullable: true,
    validations: { isLength: { max: 125 } },
  },
  feature_image_caption: { type: "text", maxlength: 65535, nullable: true },
  email_only: { type: "bool", nullable: false, defaultTo: false },
};

export const users = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  name: { type: "string", maxlength: 191, nullable: false },
  slug: { type: "string", maxlength: 191, nullable: false, unique: true },
  password: { type: "string", maxlength: 60, nullable: false },
  email: {
    type: "string",
    maxlength: 191,
    nullable: false,
    unique: true,
    validations: { isEmail: true },
  },
  profile_image: { type: "string", maxlength: 2000, nullable: true },
  cover_image: { type: "string", maxlength: 2000, nullable: true },
  bio: {
    type: "text",
    maxlength: 65535,
    nullable: true,
    validations: { isLength: { max: 200 } },
  },
  website: {
    type: "string",
    maxlength: 2000,
    nullable: true,
    validations: { isEmptyOrURL: true },
  },
  location: {
    type: "text",
    maxlength: 65535,
    nullable: true,
    validations: { isLength: { max: 150 } },
  },
  facebook: { type: "string", maxlength: 2000, nullable: true },
  twitter: { type: "string", maxlength: 2000, nullable: true },
  accessibility: { type: "text", maxlength: 65535, nullable: true },
  // TODO: would be good to add validation here to control for all possible status values.
  //       The ones that come up by reviewing the user model are:
  //       'active', 'inactive', 'locked', 'warn-1', 'warn-2', 'warn-3', 'warn-4'
  status: {
    type: "string",
    maxlength: 50,
    nullable: false,
    defaultTo: "active",
  },
  // NOTE: unused at the moment and reserved for future features
  locale: { type: "string", maxlength: 6, nullable: true },
  visibility: {
    type: "string",
    maxlength: 50,
    nullable: false,
    defaultTo: "public",
    validations: { isIn: [["public"]] },
  },
  last_seen: { type: "dateTime", nullable: true },
  created_at: { type: "dateTime", nullable: false },
  created_by: { type: "string", maxlength: 24, nullable: false },
  updated_at: { type: "dateTime", nullable: true },
  updated_by: { type: "string", maxlength: 24, nullable: true },
};

export const tags = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  name: {
    type: "string",
    maxlength: 191,
    nullable: false,
    validations: { matches: /^([^,]|$)/ },
  },
  slug: { type: "string", maxlength: 191, nullable: false, unique: true },
  parent_id: { type: "string", nullable: true },
  visibility: {
    type: "string",
    maxlength: 50,
    nullable: false,
    defaultTo: "public",
    validations: { isIn: [["public", "internal"]] },
  },

  accent_color: { type: "string", maxlength: 50, nullable: true },
  created_at: { type: "dateTime", nullable: false },
  created_by: { type: "string", maxlength: 24, nullable: false },
  updated_at: { type: "dateTime", nullable: true },
  updated_by: { type: "string", maxlength: 24, nullable: true },
};

export const posts_tags = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  post_id: {
    type: "string",
    maxlength: 24,
    nullable: false,
    references: "posts.id",
  },
  tag_id: {
    type: "string",
    maxlength: 24,
    nullable: false,
    references: "tags.id",
  },
  sort_order: {
    type: "integer",
    nullable: false,
    unsigned: true,
    defaultTo: 0,
  },
};

export const roles = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  name: { type: "string", maxlength: 50, nullable: false, unique: true },
  description: { type: "string", maxlength: 2000, nullable: true },
  created_at: { type: "dateTime", nullable: false },
  created_by: { type: "string", maxlength: 24, nullable: false },
  updated_at: { type: "dateTime", nullable: true },
  updated_by: { type: "string", maxlength: 24, nullable: true },
};

export const roles_users = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  role_id: { type: "string", maxlength: 24, nullable: false },
  user_id: { type: "string", maxlength: 24, nullable: false },
};

export const permissions = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  name: { type: "string", maxlength: 50, nullable: false, unique: true },
  object_type: { type: "string", maxlength: 50, nullable: false },
  action_type: { type: "string", maxlength: 50, nullable: false },
  object_id: { type: "string", maxlength: 24, nullable: true },
  created_at: { type: "dateTime", nullable: false },
  created_by: { type: "string", maxlength: 24, nullable: false },
  updated_at: { type: "dateTime", nullable: true },
  updated_by: { type: "string", maxlength: 24, nullable: true },
};

export const permissions_users = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  user_id: { type: "string", maxlength: 24, nullable: false },
  permission_id: { type: "string", maxlength: 24, nullable: false },
};

export const permissions_roles = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  role_id: { type: "string", maxlength: 24, nullable: false },
  permission_id: { type: "string", maxlength: 24, nullable: false },
};

export const invites = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  role_id: { type: "string", maxlength: 24, nullable: false },
  status: {
    type: "string",
    maxlength: 50,
    nullable: false,
    defaultTo: "pending",
    validations: { isIn: [["pending", "sent"]] },
  },
  token: { type: "string", maxlength: 191, nullable: false, unique: true },
  email: {
    type: "string",
    maxlength: 191,
    nullable: false,
    unique: true,
    validations: { isEmail: true },
  },
  expires: { type: "bigInteger", nullable: false },
  created_at: { type: "dateTime", nullable: false },
  created_by: { type: "string", maxlength: 24, nullable: false },
  updated_at: { type: "dateTime", nullable: true },
  updated_by: { type: "string", maxlength: 24, nullable: true },
};

export const brute = {
  key: { type: "string", maxlength: 191, primary: true },
  firstRequest: { type: "bigInteger" },
  lastRequest: { type: "bigInteger" },
  lifetime: { type: "bigInteger" },
  count: { type: "integer" },
};

export const oauth = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  provider: { type: "string", maxlength: 50, nullable: false },
  provider_id: { type: "string", maxlength: 191, nullable: false },
  access_token: { type: "text", maxlength: 65535, nullable: true },
  refresh_token: { type: "text", maxlength: 2000, nullable: true },
  created_at: { type: "dateTime", nullable: false },
  updated_at: { type: "dateTime", nullable: true },
  user_id: {
    type: "string",
    maxlength: 24,
    nullable: false,
    references: "users.id",
  },
};


export const posts_authors = {
  id: {type: 'string', maxlength: 24, nullable: false, primary: true},
  post_id: {type: 'string', maxlength: 24, nullable: false, references: 'posts.id'},
  author_id: {type: 'string', maxlength: 24, nullable: false, references: 'users.id'},
  sort_order: {type: 'integer', nullable: false, unsigned: true, defaultTo: 0}
},


export const categories = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },
  name: { type: "string", maxlength: 50, nullable: false, unique: true},
  created_at: { type: "dateTime", nullable: false },
  updated_at: { type: "dateTime", nullable: true },
}

export const meetups = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },

  created_at: { type: "dateTime", nullable: false },
  created_by: { type: "string", maxlength: 24, nullable: false },
  updated_at: { type: "dateTime", nullable: true },
  updated_by: { type: "string", maxlength: 24, nullable: true },
  published_at: { type: "dateTime", nullable: true },
  published_by: { type: "string", maxlength: 24, nullable: true },
}


export const events = {
  id: { type: "string", maxlength: 24, nullable: false, primary: true },

  created_at: { type: "dateTime", nullable: false },
  created_by: { type: "string", maxlength: 24, nullable: false },
  updated_at: { type: "dateTime", nullable: true },
  updated_by: { type: "string", maxlength: 24, nullable: true },
  published_at: { type: "dateTime", nullable: true },
  published_by: { type: "string", maxlength: 24, nullable: true },
}