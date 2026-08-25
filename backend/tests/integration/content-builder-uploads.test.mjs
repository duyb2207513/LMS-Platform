import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const api="http://localhost:3000/api/v1",stamp=Date.now().toString();
const emails=["owner","other","student"].map(x=>`content-builder-${x}-${stamp}@example.com`);
const token=user=>`Bearer ${jwt.sign({userId:user.id,role:user.role},process.env.JWT_ACCESS_SECRET,{expiresIn:"15m"})}`;
const json=(url,method,authorization,body)=>fetch(url,{method,headers:{authorization,"content-type":"application/json"},body:JSON.stringify(body)});
let categoryId,courseId;
try{
  const [owner,other,student]=await Promise.all([
    prisma.user.create({data:{fullName:"Owner",email:emails[0],passwordHash:"x",role:"INSTRUCTOR"}}),
    prisma.user.create({data:{fullName:"Other",email:emails[1],passwordHash:"x",role:"INSTRUCTOR"}}),
    prisma.user.create({data:{fullName:"Student",email:emails[2],passwordHash:"x",role:"STUDENT"}})
  ]);
  const ownerAuth=token(owner),otherAuth=token(other),studentAuth=token(student);
  const category=await prisma.category.create({data:{name:`Content builder ${stamp}`,slug:`content-builder-${stamp}`}});categoryId=category.id;
  const course=await prisma.course.create({data:{instructorId:owner.id,categoryId,title:"Content builder",slug:`content-builder-${stamp}`,description:"Test",level:"BEGINNER",isFree:true,status:"PUBLISHED",publishedAt:new Date()}});courseId=course.id;
  await prisma.enrollment.create({data:{courseId,studentId:student.id}});
  const section=await prisma.section.create({data:{courseId,title:"Section",position:1}});
  const lesson=await prisma.lesson.create({data:{sectionId:section.id,title:"Lesson",lessonType:"TEXT",position:1,isPublished:false}});

  const publishWithoutContent=await json(`${api}/lessons/${lesson.id}`,"PATCH",ownerAuth,{isPublished:true});assert.equal(publishWithoutContent.status,400);

  const textResponse=await json(`${api}/lessons/${lesson.id}/contents`,`POST`,ownerAuth,{contentType:"TEXT",textContent:"First block"});assert.equal(textResponse.status,201);const textBlock=(await textResponse.json()).data;
  const documentResponse=await json(`${api}/lessons/${lesson.id}/contents`,`POST`,ownerAuth,{contentType:"DOCUMENT"});assert.equal(documentResponse.status,201);const documentBlock=(await documentResponse.json()).data;
  assert.equal((await json(`${api}/lessons/${lesson.id}/contents`,`POST`,otherAuth,{contentType:"TEXT",textContent:"Denied"})).status,403);
  const documentForm=new FormData();documentForm.append("file",new Blob(["%PDF-1.4\nContent"],{type:"application/pdf"}),"lesson.pdf");assert.equal((await fetch(`${api}/lesson-contents/${documentBlock.id}/file`,{method:"POST",headers:{authorization:ownerAuth},body:documentForm})).status,200);
  const imageBlockResponse=await json(`${api}/lessons/${lesson.id}/contents`,`POST`,ownerAuth,{contentType:"DOCUMENT"});assert.equal(imageBlockResponse.status,201);const imageBlock=(await imageBlockResponse.json()).data;
  const imageContentForm=new FormData();imageContentForm.append("file",new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nxoAAAAASUVORK5CYII=","base64")],{type:"image/png"}),"diagram.png");const imageContentResponse=await fetch(`${api}/lesson-contents/${imageBlock.id}/file`,{method:"POST",headers:{authorization:ownerAuth},body:imageContentForm});assert.equal(imageContentResponse.status,200);assert.equal((await imageContentResponse.json()).data.mimeType,"image/png");
  const reordered=await json(`${api}/lessons/${lesson.id}/contents/reorder`,`PATCH`,ownerAuth,{contentIds:[documentBlock.id,imageBlock.id,textBlock.id]});assert.equal(reordered.status,200);assert.equal((await reordered.json()).data[0].id,documentBlock.id);
  const publishWithBlocks=await json(`${api}/lessons/${lesson.id}`,"PATCH",ownerAuth,{isPublished:true});assert.equal(publishWithBlocks.status,200);assert.equal((await publishWithBlocks.json()).data.isPublished,true);
  const learning=await (await fetch(`${api}/courses/${courseId}/content`,{headers:{authorization:studentAuth}})).json();assert.equal(learning.data.sections[0].lessons[0].contents.length,3);assert.equal(learning.data.sections[0].lessons[0].contents[1].mimeType,"image/png");

  const quiz=await prisma.quiz.create({data:{lessonId:lesson.id,title:"Quiz"}});const question=await prisma.question.create({data:{quizId:quiz.id,text:"Image question",position:1}});
  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nxoAAAAASUVORK5CYII=","base64");
  const imageForm=new FormData();imageForm.append("image",new Blob([png],{type:"image/png"}),"question.png");const imageResponse=await fetch(`${api}/questions/${question.id}/image`,{method:"POST",headers:{authorization:ownerAuth},body:imageForm});assert.equal(imageResponse.status,200);assert.ok((await imageResponse.json()).data.imageUrl);

  const assignment=await prisma.assignment.create({data:{courseId,title:"Assignment",dueAt:new Date(Date.now()+86400000),isPublished:true}});
  const attachmentForm=new FormData();attachmentForm.append("files",new Blob(["%PDF-1.4\nPrompt"],{type:"application/pdf"}),"prompt.pdf");const attachmentResponse=await fetch(`${api}/assignments/${assignment.id}/attachments`,{method:"POST",headers:{authorization:ownerAuth},body:attachmentForm});assert.equal(attachmentResponse.status,201);const attachment=(await attachmentResponse.json()).data[0];
  assert.equal((await fetch(attachment.fileUrl,{headers:{authorization:studentAuth}})).status,200);
  assert.equal((await fetch(`${api}/assignment-attachments/${attachment.id}`,{method:"DELETE",headers:{authorization:otherAuth}})).status,403);
  assert.equal((await fetch(`${api}/assignment-attachments/${attachment.id}`,{method:"DELETE",headers:{authorization:ownerAuth}})).status,204);
  console.log("Content builder uploads integration tests passed");
}finally{if(courseId)await prisma.course.deleteMany({where:{id:courseId}});if(categoryId)await prisma.category.deleteMany({where:{id:categoryId}});await prisma.user.deleteMany({where:{email:{in:emails}}});await prisma.$disconnect();}
