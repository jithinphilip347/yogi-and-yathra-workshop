"use client";
import React from 'react';
import BlogCard from '../BlogCard';
import '../../../assets/css/blog.css';

const BlogDetails = () => {
  return (
    <div id='BlogDetails'>
      
      {/* Hero Section */}
      <div className="BlogDetailsHero container">
         <div className="HeroImage">
            <img src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1000&auto=format&fit=crop" alt="Hero" />
         </div>
         <div className="HeroInfo">
            <div className="Meta">
                <span className="Category">Lifestyle</span>
                <span className="Separator">—</span>
                <span className="Date">Mar 11, 2024</span>
            </div>
            <h1>How to introduce yoga into the family routine</h1>
            <p className="Summary">Yoga is a beautiful practice that brings mindfulness, balance, and health to individuals. But it doesn&apos;t have to be a solitary journey. Introducing yoga into your family routine can foster deeper connections and promote wellness for everyone in the home.</p>
            
            <div className="Author">
                <div className="AuthorImg">
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop" alt="Author" />
                </div>
                <div className="AuthorInfo">
                    <span className="Name">Sophia Rivers</span>
                    <span className="Role">YOGA INSTRUCTOR</span>
                </div>
            </div>
         </div>
      </div>

      {/* Content Section */}
      <div className="BlogContentBody container">
         <div className="ContentInner">
             <h2>Props like blocks, straps, and blankets can help you maintain proper alignment</h2>
             <p>When starting a yoga practice, many people feel intimidated by the flexibility or strength required for certain poses. However, yoga is not about achieving the perfect pose immediately; it&apos;s about the journey and understanding your body&apos;s unique capabilities.</p>
             
             <ul>
                 <li>Start by identifying the physical goals you want to achieve with yoga.</li>
                 <li>Choose a comfortable space in your home free from distractions.</li>
                 <li>Gather basic props like a yoga mat, blocks, and a supportive blanket.</li>
                 <li>Communicate with your family members to establish a shared practice time.</li>
             </ul>

             <h2>Look for classes labeled as beginner or introductory to learn the basics and proper alignment</h2>
             <p>Building a foundation is essential. Just as a house needs a solid base, your yoga practice requires you to understand the fundamental postures. Beginner classes focus on breaking down poses safely, allowing you to learn proper alignment and breathing techniques without feeling rushed or overwhelmed.</p>
             
             <div className="ContentImage">
                 <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop" alt="Content Image" />
                 <span className="ImageCaption">Ensure you are listening to your body during every stretch.</span>
             </div>

             <h3>Patience is your best friend during years of practice</h3>
             <p>It’s completely normal to feel stiff or inflexible when you first begin. Celebrate the small victories, like being able to reach a little further or hold a pose for an extra breath. Remember that everyone&apos;s body is different, and progress is personal.</p>

             <ul>
                 <li>Take it one breath at a time. Do not rush through the movements.</li>
                 <li>If you feel pain, gently come out of the pose and rest in Child&apos;s Pose.</li>
                 <li>Consistency is more important than intensity when starting out.</li>
             </ul>

             <blockquote>
                 &quot;Amet pretium consectetur dui aliquam. Nisl quam facilisi consequat felis sit elit dapibus ipsum nullam est libero pulvinar purus et risus duis tortor facilisis&quot;
             </blockquote>

             <p>As you become more comfortable with the physical aspects of yoga, you&apos;ll likely notice changes in your mental state as well. The focus required to maintain balance and coordinate your breath with movement leaves little room for outside worries.</p>
         </div>
      </div>

      {/* Related Articles */}
      <div className="RelatedArticles">
          <div className="container">
              <div className="RelatedHeader">
                  <h2>Latest articles</h2>
              </div>
              <div className="BlogGrid">
                  <BlogCard 
                    image="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop"
                    title="7 Yoga poses to keep your body fit"
                    category="Yoga"
                    date="Mar 11, 2024"
                  />
                  <BlogCard 
                    image="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1000&auto=format&fit=crop"
                    title="How to introduce yoga into the family routine"
                    category="Lifestyle"
                    date="Mar 11, 2024"
                  />
                  <BlogCard 
                    image="https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?q=80&w=1000&auto=format&fit=crop"
                    title="Playlists to accompany your yoga practice"
                    category="Resources"
                    date="Mar 11, 2024"
                  />
              </div>
          </div>
      </div>

    </div>
  )
}

export default BlogDetails