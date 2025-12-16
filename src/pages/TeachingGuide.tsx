import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ScrollToTop from '../components/ScrollToTop';

const teachingGuideContent = `# **Instructor Guide: Using *The Principles of Diffusion Models* for Lectures**

This note is a practical guide for instructors who want to teach diffusion models from our monograph without having to read every chapter in advance. The main idea is to teach diffusion as one coherent framework, then emphasize why sampling is ODE solving, how guidance works, and why the field is moving toward flow-map models.

A concise walkthrough from a different perspective (not covering the full intuitions or insights developed in the book) is also available as a blog post:
[https://the-principles-of-di-vzje.bolt.host/blog](https://the-principles-of-di-vzje.bolt.host/blog)

## **Foundations of Diffusion Training (Ch. 1–6)**

If students already have basic knowledge of deep generative models (DGMs), Chapter 1 (introductory background on DGMs) can be skimmed very quickly.

If your goal is to give students a complete, end-to-end understanding of diffusion, we recommend following Chapters 2–6 in order. This is the core spine of the book. It introduces the three complementary origins and perspectives (variational, score/energy-based, and flow-based) and culminates in how they connect, especially in Chapter 6.

A helpful supplement is Appendix B, which presents the diffusion story through the change-of-variables viewpoint. In many classrooms, this narrative resonates strongly because it provides a clean, calculus-based mental picture of how probability mass moves during generation.

You can generally skip Chapter 7 (optimal transport) unless your course explicitly needs OT or you want a deeper geometric perspective.

## **Guided Generation (Ch. 8)**

For most courses, it is sufficient to focus on the CG/CFG section in Chapter 8. The goal is not to survey every conditioning method, but to teach the key mechanism: ODE-based sampling can be steered by taking linear combinations of vector fields. This viewpoint can be motivated cleanly from conditional modeling or Bayes' rule. Once students understand this mechanism, they can reason about many guidance variants without memorizing formulas.

## **Solvers for Fast Sampling (Ch. 9)**

We suggest keeping the discussion of solvers lightweight and practical. A good default is DDIM (Sec. 9.2) as the baseline fast sampler and DPM-Solver (Sec. 9.4) as a representative higher-order solver.

Optionally, students can skim Sec. 9.6, where modern diffusion solvers are connected back to classical numerical ODE solvers. This connection is particularly intuitive under v-parameterization (for example, DDIM is essentially Euler, and second-order DPM-Solver corresponds closely to Heun in SNR-time). For other parameterizations (x / noise / score), derivations become more technical because exponential-integrator factors are needed to handle the linear term in the diffusion ODE. We recommend treating these details as optional depth.

## **Modern Frontier: Flow-Map Models (Ch. 11)**

After the fundamentals (Ch. 1–6), guided generation (Ch. 8), and a minimal solver module (Ch. 9), we recommend jumping to Chapter 11 on diffusion-motivated flow-map models. This is a very active research direction and works well as a frontier module, especially if you want to connect the course to real-time generation and interactive systems.

## **Teaching Pace and Emphasis**

Any section marked optional is safe to skip on a first pass. These sections are intended as deeper dives rather than required components for core understanding.

Even if you cover Chapters 1–6 in order, the flow-based / flow-matching portion can usually be taught quickly. It largely mirrors the score-based story, and the key takeaways from score-based diffusion are already distilled in Sec. 5.2.1.

Chapters 2–5 also include short recaps of classic background material (such as VAEs, EBMs, and normalizing flows). These recaps are included to make the monograph self-contained, but they can be covered quickly or skipped entirely if students already have the prerequisites.

## **Four Takeaways to Anchor the Course**

A good way to frame the entire course is around four core messages:

1. Diffusion has three origins (variational, score/energy-based, flow-based), and understanding their connection (Chapter 6) turns a zoo of methods into one coherent framework.
2. Sampling is essentially solving an ODE, which explains why diffusion generation is slow and why solver design matters (Chapter 9).
3. Guidance works through linear combinations of velocity fields, giving a simple and general mechanism for steering generation (Chapter 8, CG/CFG).
4. Because iterative sampling is slow, a major direction is to learn the solution map directly, namely diffusion-motivated flow-map models (Chapter 11).

Feel free to reach out to us if you would like to discuss course design or possible teaching paths using the book. We would also be happy to receive feedback from your teaching experience and from your students.`;

export default function TeachingGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-emerald-100 p-4 rounded-full">
              <GraduationCap className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Teaching Guide
            </h1>
          </div>

          <div className="prose prose-slate prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-orange-600 hover:prose-a:text-orange-700 prose-li:text-slate-700 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {teachingGuideContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}
