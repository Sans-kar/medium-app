import { Hono } from 'hono';
import { decode, sign,verify } from "hono/jwt";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'     
import { createBlogInput, updateBlogInput } from '@sanskar2207/medium-common';


export const blogRouter=new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET:string
	},
    Variables:{
        userId:string
    }
}>();


blogRouter.use('/*', async (c, next) => {
	const authHeader = c.req.header('Authorization') || "";
	
	const user = await verify(authHeader, c.env.JWT_SECRET);
	if (!user) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
	c.set("userId", user.id);
	console.log("hi");
	await next();
})

blogRouter.get("/bulk",async(c)=>{
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	const blogs=await prisma.blog.findMany();

	return c.json({
		blogs
	})

})


blogRouter.get('/:id', async (c) => {
	const id=await c.req.param("id");
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())
    try {
		const blog=await prisma.blog.findFirst({
			where:{
				id:id
			}
		})
	
	
		return c.json({
			blog
		})
	} catch (error) {
		c.status(411)
		return c.json({
			error:"error while fetching blog post"
		})
		
	}
	
})

blogRouter.post('/', async (c) => {
	
	const body=	await c.req.json();
	const {success}=createBlogInput.safeParse(body);
	if(!success){
		c.status(411)
		return c.json({
			message:"Incorrect input fields"
		})
	}
	const authorId=c.get("userId");
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	try {
		const blog=await prisma.blog.create({
			data:{
				title:body.title,
				content:body.content,
				authorId:authorId
			}
		})
	
	
		return c.json({
			id:blog.id
		})
	} catch (error) {
		c.status(411)
		return c.json({
			error:"Not able to post data"
		})
	}
})

blogRouter.put('/',async (c) => {
	
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	const body=	await c.req.json();
	const {success}=updateBlogInput.safeParse(body);
	if(!success){
		c.status(411)
		return c.json({
			message:"Incorrect input fields"
		})
	}
	const blog=await prisma.blog.update({
		where:{
			id:body.id
		},
		data:{
			title:body.title,
			content:body.content,
		}
	})


	return c.json({
		id:blog.id
	})
})



