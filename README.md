I've been developing web apps since the 90's (think Perl and cgi-bin). Since then I must have gone through a hundred different frameworks, platforms and libraries. But now I think I've found the perfect stack for Next.js development. Let's take a look at the key components:

### Zod

Zod is a very flexible schema/validation library. The best feature Zod has over other libraries is the ability to infer types from the schema, so you can build your schema in one place and not have to create separate interfaces and types. Zod will integrate heavily into our stack.

### tRPC

tRPC stands for Typescript Remote Procedure Call. It consists of a front-end context and client that is coupled with a back-end router and handlers. The reason we will be using tRPC is for its robust Typescript and Zod integration.

### React-Query

We will be using react-query and the tRPC react-query plugin to handle managing our data state.

### Sequelize

While not as popular as Prism or Drizzle, Sequelize is an underrated ORM. Sequelize works with all the most popular SQL dialects and its great for those who prefer old-school object-oriented programming. Sequelize allows you to fully extend the model, write your own methods and custom hooks. Sequelize is also fully Typescript compatible.

Ok then, let's get started coding. This is going to be a long one, so buckle up buckaroo!

*All the code for the examples in this article will be provided in a GitHub repo. Link at the bottom.*

## Setup Project and Install Dependencies

Let's fire up a Next.js (version 15.2 at time of writing):

```bash
pnpx create-next-app@latest next-trpc-sequelize
```

Now let's install our dependencies:

```bash
pnpm i @tanstack/react-query@^4.36.1 @trpc/client@^10.45.2 @trpc/react-query@^10.45.2 @trpc/server@^10.45.2 colors lodash-es pg pg-hstore sequelize superjson zod
```

And now we'll need some dev dependencies as well:

```bash
pnpm i -D @next/env @types/lodash-es @types/pg @types/sequelize tsx
```

## Setting Up the Database

You'll need a Postgres database for this project. If you already have a Postgres dev server, go ahead and create a database for our project. If you're a docker user (which you should be), you can use this docker-compose:

```yaml
services:
     db:
          image: postgres
          restart: always
          environment:
               POSTGRES_PASSWORD: 'aaaa'
               POSTGRES_DB: 'test'
          ports:
               - '6000:5432'
          volumes:
               - test_dbdata:/var/lib/postgresql/data

volumes:
     test_dbdata:
```

To spin up this database, simply run: `docker compose up -d`.

Now let's create a `.env.local` file containing our connection string:

```bash
DB_STRING="postgresql://postgres:aaaa@localhost:6000/test"
```

## Defining Our Schemas

Our stack begins with building our Zod schemas. In this project example, we're going to build a very basic blog site. We will have a `Post` model and an `Author` model. We will create a one-to-many relationship between Post and Author.

Before we get started with our schemas, let's write a couple helper functions to save on a lot of typing. Create a file at: `src/zod/helpers.ts`:

```ts
// src/zod/helpers.ts

import { z } from "zod";

export const enumKeys = <T extends Record<string, string>>(e: T) =>
  Object.keys(e) as [keyof T, ...Array<keyof T>];

export function zOptional<T extends z.ZodTypeAny>(schema: T) {
  return z
    .union([schema, z.literal("")])
    .transform((value) => (value === "" ? undefined : value))
    .optional();
}

export function zOptionalObject<T extends z.ZodRawShape>(schema: T) {
  return z.object(schema).partial();
}
```

Now let's create the schema for our `Author` model at `src/zod/author.ts`:

```ts
// src/zod/author.ts

import { z } from 'zod';
import { zOptional } from './helpers';

export const authorConstraints = {
	name: {
		min: 3,
		max: 50,
	},
	email: {
		min: 3,
		max: 50,
	},
	bio: {
		min: 0,
		max: 255,
	},
	website: {
		min: 0,
		max: 100,
	},
};

export const authorSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(authorConstraints.name.min).max(authorConstraints.name.max),
	email: z.string().email().min(authorConstraints.email.min).max(authorConstraints.email.max),
	bio: zOptional(z.string().min(authorConstraints.bio.min).max(authorConstraints.bio.max)),
	website: zOptional(z.string().url().min(authorConstraints.website.min).max(authorConstraints.website.max)),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type T_Author = z.infer<typeof authorSchema>;

export const authorCreateSchema = authorSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export type T_AuthorCreate = z.infer<typeof authorCreateSchema>;
```

Note that we have two schemas, one to define the complete model and another to to define the required props to create a new record. As you can see, we can simply export the type using `z.infer`. Pretty cool huh? Here's what the author type looks like:

```ts
type T_Author = {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    bio?: string | undefined;
    website?: string | undefined;
}
```

Ok, now let's do the same for the `Post` model `src/zod/post.ts`:

```ts
// src/zod/post.ts

import { z } from 'zod';

import { authorSchema } from './author';

export const postConstraints = {
	title: {
		min: 3,
		max: 200,
	},
	slug: {
		min: 3,
		max: 255,
	},
	content: {
		min: 3,
		max: 10000,
	},
};

export const postSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(postConstraints.title.min).max(postConstraints.title.max),
	slug: z.string().min(postConstraints.slug.min).max(postConstraints.slug.max),
	content: z.string().min(postConstraints.content.min).max(postConstraints.content.max),
	authorId: z.string().uuid(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type T_Post = z.infer<typeof postSchema>;

export const postCreateSchema = postSchema.omit({
	id: true,
	slug: true,
	createdAt: true,
	updatedAt: true,
});

export type T_PostCreate = z.infer<typeof postCreateSchema>;

export const postExtendedSchema = postSchema.extend({
	author: authorSchema,
});

export type T_PostExtended = z.infer<typeof postExtendedSchema>;
```

Note how we can create a relation by importing the `authorSchema` and assigning it as a prop value to our `postSchema`. Here's what our inferred type looks like:


```ts
type T_PostExtended = {
    id: string;
    title: string;
    slug: string;
    content: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        bio?: string | undefined;
        website?: string | undefined;
    };
}
```

## Setting up Sequelize and Building Our Models

First, we'll need a create a Sequelize config file at `src/db/sequelize.ts`:

```ts
// src/db/sequelize.ts

import { Sequelize, Options } from 'sequelize';
import pg from 'pg';
import c from 'colors';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const USE_SSL = false;
const IS_DEV = process.env.NODE_ENV !== 'production';
const DB_STRING = process.env.DB_STRING || '';

const logQuery = (query: string) => {
	console.log(c.green(new Date().toLocaleString()));
	console.log(c.blue(query));
};

const makeConfig = () => {
	const config: Options = {
		dialect: 'postgres',
		dialectModule: pg,
		logging: IS_DEV ? logQuery : false,
	};

	if (USE_SSL) {
		config.dialectOptions = {
			ssl: {
				require: true,
				rejectUnauthorized: false,
			},
		};
	}

	return config;
};

const sequelize = new Sequelize(DB_STRING, makeConfig());

export default sequelize;
```

A few things to note here. We're using the `colors` library and a custom logging function to print queries to the console log in development mode. This is great for debugging. Next, we use the `@next/env` library to load our environment for using our config and models outside of Next.js. We'll need this for our migration script.

```ts
// src/db/sequelize.ts

import { Sequelize, Options } from 'sequelize';
import pg from 'pg';
import c from 'colors';
import { loadEnvConfig } from '@next/env';

if (process.env.NODE_ENV === 'development') {
	loadEnvConfig(process.cwd());
}

const USE_SSL = false;
const IS_DEV = process.env.NODE_ENV !== 'production';
const DB_STRING = process.env.DB_STRING || '';

const logQuery = (query: string) => {
	console.log(c.green(new Date().toLocaleString()));
	console.log(c.blue(query));
};

const makeConfig = () => {
	const config: Options = {
		dialect: 'postgres',
		dialectModule: pg,
		logging: IS_DEV ? logQuery : false,
	};

	if (USE_SSL) {
		config.dialectOptions = {
			ssl: {
				require: true,
				rejectUnauthorized: false,
			},
		};
	}

	return config;
};

const sequelize = new Sequelize(DB_STRING, makeConfig());

export default sequelize;
```

Now let's define our `Author` sequelize model `src/models/author.ts`:

```ts
// src/models/author.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sequelize';

import { authorConstraints } from '@/zod/author';
import type { T_Author, T_AuthorCreate } from '@/zod/author';

export default class Author extends Model<T_Author, T_AuthorCreate> implements T_Author {
	declare id: T_Author['id'];
	declare name: T_Author['name'];
	declare email: T_Author['email'];
	declare bio: T_Author['bio'];
	declare website: T_Author['website'];
	declare createdAt: T_Author['createdAt'];
	declare updatedAt: T_Author['updatedAt'];
}

Author.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [authorConstraints.name.min, authorConstraints.name.max],
			},
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				isEmail: true,
				len: [authorConstraints.email.min, authorConstraints.email.max],
			},
		},
		bio: {
			type: DataTypes.STRING,
			allowNull: true,
			validate: {
				len: [authorConstraints.bio.min, authorConstraints.bio.max],
			},
		},
		website: {
			type: DataTypes.STRING,
			allowNull: true,
			validate: {
				isUrl: true,
				len: [authorConstraints.website.min, authorConstraints.website.max],
			},
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		modelName: 'Author',
		tableName: 'authors',
		timestamps: true,
		underscored: true,
		indexes: [
			{
				unique: true,
				fields: ['email'],
			},
		],
	},
);
```

As you can see, we extend the Sequelize `Model` class, which takes two generic arguments, one for the complete model and one for creation. We also implement the `T_Author` type as well. Next we need to declare our properties but we refer to the `T_Author` type. Lastly, we initialize the model by defining our Postgres columns.

Note that we're using the `underscored` option as this automatically handles converting from camel case to snake case. Postgres columns don't like to be camel case. One thing to note is that when you're using underscore, you must refer to the column in the snake case format when defining indexes. Here we've defined an index for email that is unique, so validation will fail if a duplicate email address is inserted.

Next, let's do the same thing for our `Post` model `src/models/post.ts`:

```ts
// src/models/post.ts

import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sequelize';
import { kebabCase } from 'lodash-es';

import { postConstraints } from '@/zod/post';
import type { T_Post, T_PostCreate, T_PostExtended } from '@/zod/post';
import type Author from './author';

export default class Post extends Model<T_Post, T_PostCreate> implements T_Post {
	// Properties
	declare id: T_Post['id'];
	declare title: T_Post['title'];
	declare slug: T_Post['slug'];
	declare content: T_Post['content'];
	declare authorId: T_Post['authorId'];
	declare createdAt: T_Post['createdAt'];
	declare updatedAt: T_Post['updatedAt'];

	// Associations
	declare author: Author;

	// Static Methods
	static async findBySlug(slug: string): Promise<T_PostExtended | null> {
		const post = await Post.findOne({
			where: {
				slug,
			},
			include: [
				{
					association: 'author',
				},
			],
		});

		if (!post) return null;

		return post.toJSON() as T_PostExtended;
	}
}

Post.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		title: {
			type: DataTypes.STRING(postConstraints.title.max),
			allowNull: false,
			validate: {
				len: [postConstraints.title.min, postConstraints.title.max],
			},
		},
		slug: {
			type: DataTypes.STRING(postConstraints.slug.max),
			allowNull: false,
			validate: {
				len: [postConstraints.slug.min, postConstraints.slug.max],
			},
		},
		content: {
			type: DataTypes.STRING(postConstraints.content.max),
			allowNull: false,
			validate: {
				len: [postConstraints.content.min, postConstraints.content.max],
			},
		},
		authorId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		modelName: 'Post',
		tableName: 'posts',
		timestamps: true,
		paranoid: false,
		underscored: true,
		indexes: [
			{
				unique: true,
				fields: ['slug'],
			},
		],
		hooks: {
			beforeValidate: (post: Post) => {
				if (!post.slug) {
					post.slug = kebabCase(post.title);
				}
			},
			beforeBulkCreate: (posts: Post[]) => {
				posts.forEach(post => {
					if (!post.slug) {
						post.slug = kebabCase(post.title);
					}
				});
			},
		},
	},
);
```

Hopefully you are beginning to see the power of Sequelize in this model class. We import the Zod inferred types as before, but we also import the `Author` model as a type to declare as an association.

Next, we create a unique slug index, which is mostly how we'll be referencing our posts. Lastly, let's create some custom hooks to automagically create our slugs using `lodash/kebabCase`. These custom hooks are a very powerful feature of Sequelize.

Also note that we can define custom static and instance methods, such as the `findBySlug()` method.

Ok, now that we have our models, we need to aggregate them in and index and define our relations. Create a file at `src/models/index.ts`:

```ts
// src/models/index.ts

import Post from './post';
import Author from './author';

Post.belongsTo(Author, {
	foreignKey: 'authorId',
	as: 'author',
});

Author.hasMany(Post, {
	foreignKey: 'authorId',
	as: 'posts',
});

export { Post, Author };
```

This creates a one-to-many relationship between `Author` and `Post`. So posts have only one author and authors have many posts.

Note that you must import your models from this index file and not from the original file or the associations will not be defined.

## Writing a Migration Script

Ok, now let's write a script that will sync our models with the database and insert some dummy data. Create a file in `src/db/migrate.ts`:

```ts
// src/db/migrate.ts

import { Author, Post } from '@/models';
import sequelize from './sequelize';

import type { T_PostCreate } from '@/zod/post';
import type { T_AuthorCreate } from '@/zod/author';

(async () => {
	await sequelize.drop({
		cascade: true,
	});

	await Author.sync({ force: true, alter: true });
	await Post.sync({ force: true, alter: true });

	const authors: T_AuthorCreate[] = [
		{
			name: 'Jay',
			email: 'jay@example.com',
			bio: 'I am a software engineer.',
			website: 'https://blog.designly.biz',
		},
	];

	await Author.bulkCreate(authors);

	const author = await Author.findOne({
		where: {
			email: 'jay@example.com',
		},
	});
	if (!author) throw new Error('Author not found.');

	const posts: T_PostCreate[] = [
		{
			title: 'Hello, World!',
			content: 'This is my first post.',
			authorId: author.id,
		},
	];

	await Post.bulkCreate(posts);

	process.exit(0);
})();
```

This is an auto-executing script. Now let's add it to our scripts in `package.json`:

```json
"scripts": {
	"migrate": "tsx ./src/db/migrate.ts"
}
```

Now let's run it: `pnpm migrate`.

You should get a list of timestamped SQL statements in the server console log. If you get an error, please check your configuration and try again.

## Configuring tRPC Server

And now for the hard part... well it's not really hard, just a lot of boilerplate. tRPC is divided into the following components:

1. A client context that wraps the entire app
2. Routers that handle get requests, creation and mutations
3. Handlers that plug into the routers' methods
4. An API route that handles all tRPC requests

First, let's create a function that sets up our tRPC server `src/trpc/index.ts`:

```ts
// src/trpc/index.ts

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

export default function getTrpc() {
	return initTRPC.create({
		transformer: superjson,
	});
}
```

Note that we plugin `superjson` to format our output as JSON. tRPC is flexible and you can format your output however you like.

Next, we'll write our handlers. Let's create one for our Author model `src/trpc/handlers/author/get.ts`:

```ts
// src/trpc/handlers/author/get.ts

import { Author } from '@/models';

export async function handlerGetAuthor({ input }: { input: string }) {
	const author = await Author.findByPk(input);

	if (!author) {
		return null;
	}

	return author.toJSON();
}
```

Input is provided by the router we will create shortly. Input can be any type: a string, a number, and object or array.

Now let's make one for our Post model `src/trpc/handlers/post/get.ts`:

```ts
// src/trpc/handlers/post/get.ts

import { Post } from '@/models';

export async function handlerGetPost({ input }: { input: string }) {
	const post = await Post.findBySlug(input);

	return post;
}
```

Next, we need to create a router for each model type. Then we'll plug these handlers in to each method `src/trpc/routers/author.ts`:

```ts
import { z } from 'zod';
import getTrpc from '..';
import { handlerGetAuthor } from '../handlers';

export const t = getTrpc();

export const authorRouter = t.router({
	get: t.procedure.input(z.string()).query(handlerGetAuthor),
});
```

As you can see the `input()` method takes a Zod schema. You could define a more complex schema that includes perhaps a search term, pagination and filters. We call the `query()` method and plug in the handler. This sets up the router to accept a `GET` request from our main router handler (which we'll handle shortly).

Ok now let's make a router for our Post model `src/trpc/routers/post.ts`:

```ts
// src/trpc/routers/post.ts

import { z } from 'zod';
import getTrpc from '..';
import { handlerGetPost } from '../handlers';

export const t = getTrpc();

export const postRouter = t.router({
	getBySlug: t.procedure.input(z.string()).query(handlerGetPost),
});
```

Now we need to take our routers and combine them into a single router object that we'll pass to a Next.js route enpoint `src/routers/index.ts`:

```ts
// src/trpc/routers/index.ts

import getTrpc from '..';

// Routers
import { authorRouter } from './author';
import { postRouter } from './post';

const t = getTrpc();

export const trpcRouter = t.router({
	author: authorRouter,
	post: postRouter,
});

export type AppRouter = typeof trpcRouter;
```

Lastly, we need to create our tRPC endpoint. This endpoint will catch all tRPC requests `src/app/api/trpc/[trpc]/route.ts`:

```ts
// src/app/api/trpc/[trpc]/route.ts

import { NextRequest } from 'next/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { trpcRouter } from '@/trpc/routers';

const t = (req: NextRequest) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: trpcRouter,
		createContext: () => ({}),
	});
};

export { t as GET, t as POST, t as PUT, t as DELETE, t as PATCH };
```

So here we pass our `NextRequest` to a function that returns the fetch adapter, to which we pass our router and the request object. Lastly, we export that function as each type of HTTP verb as this handler will handle all requests of every type.

Ok! 😮‍💨 I did say there would be a lot of boilerplate, but I think it will be worth it. Now adding more models, routers and handlers will be pretty strait-forward. So that's it for the server. Now on to the client!
## Configuring tRPC Client

Setting up the client it much easier and less code than the server. We simply need to create a client context that will wrap our app `src/trpc/provider.ts`:

```ts
// src/trpc/provider.tsx

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import type { AppRouter } from './routers';

export const trpc = createTRPCReact<AppRouter>();

const trpcClient = trpc.createClient({
	links: [
		httpBatchLink({
			url: '/api/trpc',
		}),
	],
	transformer: superjson,
});

export default function TrpcProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				{children}
			</trpc.Provider>
		</QueryClientProvider>
	);
}
```

Once again, we use `superjson` to transform our input to JSON. We're also using `react-query` to handle our state and cache. It's a really nice setup!

Now, how I normally setup my Next.js apps is I create a "providers" client component to handle all my client-side context providers `src/app/providers.tsx`:

```ts
// src/app/providers.tsx

'use client';

import React from 'react';
import TrpcProvider from '@/trpc/provider';

export default function Providers({ children }: { children: React.ReactNode }) {
	return <TrpcProvider>{children}</TrpcProvider>;
}
```

Lastly, we'll wrap the entire app in `layout.tsx`:

```ts
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
```

Now all we have to do is make a client component and make our tRPC request:

```ts
'use client';

import React from 'react';

import { trpc } from '@/trpc/provider';

export default function HomeView() {
	const { data } = trpc.post.getBySlug.useQuery('hello-world');

	return (
		<div>
			<h1>Welcome to your Next.js app!</h1>
			<pre>{JSON.stringify(data, null, 4)}</pre>
		</div>
	);
}
```

Pretty cool huh? Here's what the type of `data` comes out to be:

```ts
const data: {
    title: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
        id: string;
        name: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        bio?: string | undefined;
        website?: string | undefined;
    };
    slug: string;
    content: string;
    authorId: string;
} | null | undefined
```

So as you can see, we have end-to-end type safety coupled with Zod form validation. Our types start at Zod, then pass to the model and then pass to tRPC. Making changes to the model is as simple as updating the Zod schema and declaring and initializing the column in the model file.

If you liked this article, please let me know! I plan on doing a follow up article where we'll integrate ChadCN,  react-hook-form, Zod and tRPC to effortlessly handle our forms. Let me know in the comments if this is something you'd like to read!

GitHub repo: [https://github.com/designly1/next-trpc-sequelize](https://github.com/designly1/next-trpc-sequelize).

---

### Thank You!

Thank you for taking the time to read my article and I hope you found it useful (or at the very least, mildly entertaining). For more great information about web dev, systems administration and cloud computing, please read the [Designly Blog](https://blog.designly.biz). Also, please leave your comments! I love to hear thoughts from my readers.

If you want to support me, please follow me on [Spotify](https://open.spotify.com/album/2fq9S51ULwPmRM6EdCJAaJ?si=USeZDsmYSKSaGpcrSJJsGg)!

### Current Projects

- [Snoozle.io](https://snoozle.io)- An AI app that generates bedtime stories for kids ❤️
- [react-poptart](https://react-poptart.vercel.app/) - A React Notification / Alerts Library (under 20kB)
- [Spectravert](https://spectravert.com/) - A cross-platform video converter (ffmpeg GUI)
- [Smartname.app](https://smartname.app/) - An AI name generator for a variety of purposes

Looking for a web developer? I'm available for hire! To inquire, please fill out a [contact form](https://designly.biz/contact).
