import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <article className="prose prose-lg prose-slate max-w-none">
          <header className="mb-12 pb-8 border-b border-slate-200">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Tracing the Principles Behind Modern Diffusion Models
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Diffusion models can feel like a jungle of acronyms, but the core idea is simple: start from noise and gradually move a cloud of samples until it looks like real data. This post gives an intuition-first tour showing that DDPMs, score-based models, and flow matching are the same recipe with different prediction targets, all rooted in the change-of-variable rule from calculus and powered by one shared "conditional trick" that turns learning into supervised regression. Finally, we zoom out to the speed problem and show how flow map models aim to replace many tiny denoising steps with a few big, accurate jumps toward real-time generation.
            </p>
            <div className="mt-6 text-sm text-slate-500">
              <p>Date: April 27, 2026</p>
            </div>
          </header>

          <div className="space-y-8">
            <section>
              <p className="text-lg leading-relaxed text-slate-700">
                Modern diffusion models are often introduced through a long list of concepts and terms whose relationships are not immediately clear. Very quickly, one encounters names such as <em>DDPM, SDE, ODE, probability flow, flow matching, distillation, consistency, flow map</em>, together with phrases like <em>forward process, reverse process, score, velocity field, sampler</em>. For a reader encountering these ideas for the first time, this can be overwhelming.
              </p>

              <p className="text-lg leading-relaxed text-slate-700">
                In what follows, we slow the story down and keep a single guiding thread:
              </p>

              <blockquote className="border-l-4 border-blue-500 pl-6 italic text-xl text-slate-700 my-6">
                All these models describe different ways to <em>move probability mass</em> from "simple noise" to "complicated data". Under the surface, they are all based on the same principle from calculus: the <em>change-of-variable rule</em>.
              </blockquote>

              <p className="text-lg leading-relaxed text-slate-700">
                In the rest of this article, we build the picture step by step.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
                I. A Systematic Tour of Diffusion Models
              </h2>

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                The Generative Goal
              </h3>

              <p className="leading-relaxed text-slate-700">
                We first discuss the goal, before introducing any technical machinery.
              </p>

              <p className="leading-relaxed text-slate-700">
                On the simple side, we can easily generate randomness. For example, we can draw a vector of independent Gaussian variables, which looks like pure "static". On the complex side, we have realistic data: natural images, short audio clips, 3D shapes, and so on. These objects are high-dimensional and exhibit rich structure. A <em>deep generative model</em> is a procedure that maps from the simple side to the complex side. It turns noise into data.
              </p>

              <p className="leading-relaxed text-slate-700">
                <strong>Diffusion-style models</strong> follow a different philosophy. Instead of jumping directly from noise to data, they move in many <em>small increments</em>. More precisely, the construction consists of two coupled procedures:
              </p>

              <ul className="space-y-4 my-6">
                <li className="leading-relaxed text-slate-700">
                  In the <strong>forward process</strong>, we start from real data and gradually add small amounts of simple random noise at many tiny steps. As this corruption progresses, fine details disappear first, then larger structures become indistinct, and eventually every sample looks like featureless noise.
                </li>
                <li className="leading-relaxed text-slate-700">
                  In the <strong>reverse process</strong>, the model learns to undo this artificial corruption step by step. Starting from pure noise, it applies a sequence of learned denoising updates that gradually reintroduce structure: coarse shapes first, then finer details.
                </li>
              </ul>

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                Forward Process
              </h3>

              <p className="leading-relaxed text-slate-700">
                It helps to first make the <em>forward noising rule</em> completely concrete. Modern common diffusion models all start from this same basic construction.
              </p>

              <p className="leading-relaxed text-slate-700">
                Let <InlineMath math="\mathbf{x}_0 \in \mathbb{R}^D" /> be a clean data sample sampled from a given data distribution <InlineMath math="p_{\text{data}}" />. The forward process gradually corrupts <InlineMath math="\mathbf{x}_0" /> into a noisy version <InlineMath math="\mathbf{x}_t" />. A standard choice is:
              </p>

              <BlockMath math="p(\mathbf{x}_t \mid \mathbf{x}_0) = \mathcal{N}\bigl(\mathbf{x}_t;\,\alpha_t\,\mathbf{x}_0,\;\sigma_t^2\,\mathbf{I}\bigr)" />

              <p className="leading-relaxed text-slate-700">
                where <InlineMath math="\alpha_t" /> and <InlineMath math="\sigma_t" /> are scalar functions of time <InlineMath math="t" />. Equivalently:
              </p>

              <BlockMath math="\boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I}), \qquad \mathbf{x}_t = \alpha_t \mathbf{x}_0 + \sigma_t \boldsymbol{\epsilon}" />

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                Reverse Process
              </h3>

              <p className="leading-relaxed text-slate-700">
                Once the forward noising process is fixed, most diffusion "flavors" differ in just two choices:
              </p>

              <ol className="list-decimal list-inside space-y-2 my-4">
                <li className="leading-relaxed text-slate-700">What the network predicts from <InlineMath math="(\mathbf{x}_t, t)" /></li>
                <li className="leading-relaxed text-slate-700">How we use that prediction at sampling time to go from noise back to data</li>
              </ol>

              <h4 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                DDPM: Predicting the Reverse Step via Noise or Mean
              </h4>

              <p className="leading-relaxed text-slate-700">
                Denoising Diffusion Probabilistic Models (DDPM) train a model to run the forward process in reverse. In DDPM, we work with discrete noise levels <InlineMath math="t = 0, 1, \dots, T" />.
              </p>

              <p className="leading-relaxed text-slate-700">
                The key move, the <em>conditional trick</em>, is to condition on the clean data <InlineMath math="\mathbf{x}_0" /> to obtain a tractable regression target:
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 my-6">
                <BlockMath math="\mathbb{E}_{p_t(\mathbf{x}_t)}\!\big[ D_{\mathrm{KL}}(p(\mathbf{x}_{t-1}\mid \mathbf{x}_t)\,\|\,p_\theta(\mathbf{x}_{t-1}\mid \mathbf{x}_t)) \big] = \mathbb{E}_{p_{\text{data}}(\mathbf{x}_0)}\mathbb{E}_{p(\mathbf{x}_t\mid \mathbf{x}_0)} \big[ D_{\mathrm{KL}}(p(\mathbf{x}_{t-1}\mid \mathbf{x}_t,\mathbf{x}_0)\,\|\,p_\theta(\mathbf{x}_{t-1}\mid \mathbf{x}_t)) \big] + C" />
              </div>

              <p className="leading-relaxed text-slate-700">
                The standard choice is to predict the noise:
              </p>

              <BlockMath math="\mathcal{L}_{\text{variational}}(\theta) = \mathbb{E}_{t,\,\mathbf{x}_0,\,\boldsymbol{\epsilon}} \Big[ \lambda(t)\, \big\| \boldsymbol{\epsilon}_\theta(\mathbf{x}_t,t)-\boldsymbol{\epsilon} \big\|_2^2 \Big]" />

              <h4 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                Score-Based Methods: Predict the Score
              </h4>

              <p className="leading-relaxed text-slate-700">
                Score-based diffusion models train the network to predict the <em>score</em> at each noise level <InlineMath math="t" />:
              </p>

              <BlockMath math="\nabla_{\mathbf{x}}\log p_t(\mathbf{x})" />

              <p className="leading-relaxed text-slate-700">
                The conditional trick gives:
              </p>

              <BlockMath math="\nabla_{\mathbf{x}_t}\log p(\mathbf{x}_t\mid \mathbf{x}_0) = -\frac{1}{\sigma_t^2}\bigl(\mathbf{x}_t-\alpha_t\mathbf{x}_0\bigr)" />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 my-6">
                <BlockMath math="\mathbb{E}_{t}\,\mathbb{E}_{\mathbf{x}_t\sim p_t} \Big[ \lambda(t)\, \big\| \mathbf{s}_\theta(\mathbf{x}_t,t) - \nabla_{\mathbf{x}_t}\log p_t(\mathbf{x}_t) \big\|_2^2 \Big] = \mathbb{E}_{t}\,\mathbb{E}_{\mathbf{x}_0\sim p_{\text{data}}}\,\mathbb{E}_{\mathbf{x}_t\sim p(\cdot\mid \mathbf{x}_0)} \Big[ \lambda(t)\, \big\| \mathbf{s}_\theta(\mathbf{x}_t,t) -\nabla_{\mathbf{x}_t}\log p_t(\mathbf{x}_t\mid \mathbf{x}_0) \big\|_2^2 \Big] + C" />
              </div>

              <p className="leading-relaxed text-slate-700">
                The probability-flow ODE:
              </p>

              <BlockMath math="\frac{\mathrm{d}\mathbf{x}(t)}{\mathrm{d}t} = f(t)\mathbf{x}(t) -\frac{1}{2}g^2(t)\mathbf{s}_\theta(\mathbf{x}(t),t)" />

              <h4 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                Flow Matching: Predict the Velocity
              </h4>

              <p className="leading-relaxed text-slate-700">
                Flow matching trains the network to output the <em>velocity field</em> directly:
              </p>

              <BlockMath math="\mathbf{v}^{\text{cond}}(\mathbf{x}_t,t) := \dot{\mathbf{x}}_t = \dot{\alpha}_t\,\mathbf{x}_0+\dot{\sigma}_t\,\boldsymbol{\epsilon}" />

              <BlockMath math="\mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t,\,\mathbf{x}_0,\,\boldsymbol{\epsilon}} \Big[ \lambda(t)\, \big\| \mathbf{v}_\theta(\mathbf{x}_t,t) - (\dot{\alpha}_t\,\mathbf{x}_0+\dot{\sigma}_t\,\boldsymbol{\epsilon}) \big\|_2^2 \Big]" />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 my-6">
                <BlockMath math="\mathbb{E}_{t}\,\mathbb{E}_{\mathbf{x}_t\sim p_t} \Big[ \lambda(t)\, \big\| \mathbf{v}_\theta(\mathbf{x}_t,t)-\mathbf{v}(\mathbf{x}, t) \big\|_2^2 \Big] = \mathbb{E}_{t,\,\mathbf{x}_0,\,\boldsymbol{\epsilon}} \Big[ \lambda(t)\, \big\| \mathbf{v}_\theta(\mathbf{x}_t,t)-\mathbf{v}^{\text{cond}}(\mathbf{x}_t,t) \big\|_2^2 \Big] + C" />
              </div>

              <p className="leading-relaxed text-slate-700">
                At test time, we integrate the ODE:
              </p>

              <BlockMath math="\frac{\mathrm{d}\mathbf{x}(t)}{\mathrm{d}t}=\mathbf{v}_\theta(\mathbf{x}(t),t)" />

              <h5 className="text-lg font-semibold text-slate-800 mt-4 mb-2">
                Euler Step (DDIM-style)
              </h5>

              <BlockMath math="\mathbf{x}_{t-\Delta t} = \mathbf{x}_t -\Delta t\,\mathbf{v}_\theta(\mathbf{x}_t,t)" />

              <h5 className="text-lg font-semibold text-slate-800 mt-4 mb-2">
                Heun Step (2nd-order DPM-Solver-style)
              </h5>

              <BlockMath math="\tilde{\mathbf{x}}_{t-\Delta t} = \mathbf{x}_t-\Delta t\,\mathbf{v}_\theta(\mathbf{x}_t,t)" />
              <BlockMath math="\mathbf{x}_{t-\Delta t} = \mathbf{x}_t -\frac{\Delta t}{2}\Big( \mathbf{v}_\theta(\mathbf{x}_t,t) + \mathbf{v}_\theta(\tilde{\mathbf{x}}_{t-\Delta t},\,t-\Delta t) \Big)" />

              <h4 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                Three Lenses on the Same Diffusion Path
              </h4>

              <p className="leading-relaxed text-slate-700">
                With the same fixed forward Gaussian rule, all these methods differ only in <em>which learnable target we use</em>:
              </p>

              <ul className="list-disc list-inside space-y-2 my-4">
                <li className="leading-relaxed text-slate-700"><strong>DDPM:</strong> predict the noise</li>
                <li className="leading-relaxed text-slate-700"><strong>Score SDE:</strong> predict the score</li>
                <li className="leading-relaxed text-slate-700"><strong>Flow matching:</strong> predict the velocity</li>
              </ul>

              <p className="leading-relaxed text-slate-700">
                They all use the same <em>conditional trick</em> to make training tractable.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
                II. Change-of-Variable Formulas
              </h2>

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                The Intuition
              </h3>

              <p className="leading-relaxed text-slate-700">
                All the forward and reverse procedures can be viewed through the same geometric lens: we draw many points from some distribution and then <em>move those points together</em>. Moving every point deforms the cloud: some regions get more crowded, others become more sparse.
              </p>

              <blockquote className="border-l-4 border-blue-500 pl-6 italic text-lg text-slate-700 my-6">
                In diffusion models, what happens to the underlying <em>probability density</em> when we move all points?
              </blockquote>

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                The Math We Already Know
              </h3>

              <h4 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                Calculus 101 (One Dimension)
              </h4>

              <p className="leading-relaxed text-slate-700">
                Let <InlineMath math="x_0\in\mathbb{R}" /> be a random variable with density <InlineMath math="p_0(x_0)" />. Apply a smooth invertible map <InlineMath math="\Psi:\mathbb{R}\to\mathbb{R}" />:
              </p>

              <BlockMath math="p_1(x_1) = p_0\bigl(\Psi^{-1}(x_1)\bigr)\, \left|\frac{\mathrm{d}\Psi^{-1}}{\mathrm{d} x_1}\right|" />

              <h4 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                Higher Dimensions
              </h4>

              <p className="leading-relaxed text-slate-700">
                In <InlineMath math="\mathbb{R}^D" />, let <InlineMath math="\Psi:\mathbb{R}^D\to\mathbb{R}^D" /> be a smooth bijection:
              </p>

              <BlockMath math="p_1(\mathbf{x}_1) = p_0\bigl(\Psi^{-1}(\mathbf{x}_1)\bigr)\, \left|\det\frac{\partial \Psi^{-1}}{\partial \mathbf{x}_1}\right|" />

              <blockquote className="border-l-4 border-blue-500 pl-6 italic text-lg text-slate-700 my-6">
                If we move points by an invertible map, density changes according to how much the map locally stretches or compresses space.
              </blockquote>

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                From One Big Map to a Time-Evolution
              </h3>

              <p className="leading-relaxed text-slate-700">
                To get to diffusion-style dynamics, we apply <em>many tiny warps</em> in sequence. A natural "tiny warp" is:
              </p>

              <BlockMath math="\mathbf{x}_{t+\Delta t}=\mathbf{x}_t+\Delta t\,\mathbf{v}_t(\mathbf{x}_t)" />

              <p className="leading-relaxed text-slate-700">
                Taking the limit <InlineMath math="\Delta t\to 0" /> yields the <em>continuity equation</em>:
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 my-6">
                <BlockMath math="\frac{\partial p_t(\mathbf{x})}{\partial t} = -\nabla_{\mathbf{x}}\cdot\bigl(p_t(\mathbf{x})\,\mathbf{v}_t(\mathbf{x})\bigr)" />
              </div>

              <p className="leading-relaxed text-slate-700">
                The continuity equation says density changes only because probability mass <em>flows</em> across space.
              </p>

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                Enter the Noise
              </h3>

              <p className="leading-relaxed text-slate-700">
                The forward diffusion process adds a Gaussian jitter. This adds a second contribution: a "spreading" flow that pushes mass from high density to low density:
              </p>

              <BlockMath math="\mathbf{J}_{\text{spread}}(\mathbf{x},t) = -\frac{1}{2}g^2(t)\,\nabla_{\mathbf{x}}p_t(\mathbf{x})" />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 my-6">
                <BlockMath math="\frac{\partial p_t(\mathbf{x})}{\partial t} = -\nabla_{\mathbf{x}}\cdot\bigl(\mathbf{f}_t(\mathbf{x})\,p_t(\mathbf{x})\bigr) +\frac{1}{2}g(t)^2\,\Delta_{\mathbf{x}}p_t(\mathbf{x})" />
              </div>

              <p className="leading-relaxed text-slate-700">
                This is the Fokker–Planck equation: drift moves the probability cloud, and Gaussian jitters blur it.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
                III. From Slow Samplers to Flow Maps
              </h2>

              <p className="leading-relaxed text-slate-700">
                Standard diffusion sampling is iterative and can be slow. This raises a natural question:
              </p>

              <blockquote className="border-l-4 border-blue-500 pl-6 italic text-lg text-slate-700 my-6">
                Can we design a generative principle that trains stably and samples quickly?
              </blockquote>

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                What Is a Flow Map Model?
              </h3>

              <p className="leading-relaxed text-slate-700">
                A <em>flow map</em> is a time-jump operator that tells us where a point ends up after evolving for a while:
              </p>

              <BlockMath math="\Psi_{s\to t}(\mathbf{x}_s) = \mathbf{x}_s+\int_s^t \mathbf{v}\bigl(\mathbf{x}(u),u\bigr)\,\mathrm{d}u" />

              <p className="leading-relaxed text-slate-700">
                A flow map model tries to learn this jump directly:
              </p>

              <BlockMath math="\mathbf{G}_\theta(\mathbf{x}_s,s,t)\approx \Psi_{s\to t}(\mathbf{x}_s)" />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 my-6">
                <BlockMath math="\mathcal{L}_{\text{oracle}}(\theta) = \mathbb{E}_{s,t}\,\mathbb{E}_{\mathbf{x}_s\sim p_s} \Bigl[ w(s,t)d\bigl(\mathbf{G}_\theta(\mathbf{x}_s,s,t),\,\Psi_{s\to t}(\mathbf{x}_s)\bigr) \Bigr]" />
              </div>

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                Three Flow Map Families
              </h3>

              <h4 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                Consistency Models (CM)
              </h4>

              <p className="leading-relaxed text-slate-700">
                CM fixes the terminal time at 0 and focuses on <InlineMath math="\Psi_{s\to 0}" />:
              </p>

              <BlockMath math="\mathbf{f}_\theta(\mathbf{x}_s,s)\approx \Psi_{s\to 0}(\mathbf{x}_s)" />

              <p className="leading-relaxed text-slate-700">
                Uses self-consistency: any two states on the same trajectory must share the same endpoint.
              </p>

              <h4 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                Consistency Trajectory Models (CTM)
              </h4>

              <p className="leading-relaxed text-slate-700">
                CTM learns the general flow map with a solver-like parameterization:
              </p>

              <BlockMath math="\mathbf{G}_\theta(\mathbf{x}_s,s,t) := \frac{t}{s}\,\mathbf{x}_s + \Bigl(1-\frac{t}{s}\Bigr)\,\mathbf{g}_\theta(\mathbf{x}_s,s,t)" />

              <p className="leading-relaxed text-slate-700">
                Uses the semigroup property: a long jump should agree with two shorter jumps stitched together.
              </p>

              <h4 className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                Mean Flow (MF)
              </h4>

              <p className="leading-relaxed text-slate-700">
                MF predicts an average integration over the interval:
              </p>

              <BlockMath math="\mathbf{h}(\mathbf{x}_s,s,t) := \frac{1}{t-s}\int_s^t \mathbf{v}\bigl(\mathbf{x}(u),u\bigr)\,\mathrm{d}u" />

              <BlockMath math="\Psi_{s\to t}(\mathbf{x}_s)\approx \mathbf{x}_s+(t-s)\,\mathbf{h}_\theta(\mathbf{x}_s,s,t)" />

              <p className="leading-relaxed text-slate-700">
                Uses the MF identity to turn an integral quantity into a local relation.
              </p>

              <h3 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">
                How the Three Flow Map Families Relate
              </h3>

              <p className="leading-relaxed text-slate-700">
                CTM contains CM as a special anchored case. CTM and MF are mathematically related: they aim at the same oracle flow map but use different parameterizations:
              </p>

              <BlockMath math="\Psi_{t\to s}(\mathbf{x}_t) = \frac{s}{t}\mathbf{x}_t + \frac{t-s}{t}\underbrace{\Bigl[\mathbf{x}_t+\frac{t}{t-s}\int_t^s \mathbf{v}(\mathbf{x}_u, u)\,\mathrm{d}u\Bigr]}_{\approx\,\mathbf{g}_\theta}" />

              <BlockMath math="= \mathbf{x}_t + (s-t)\underbrace{\Bigl[\frac{1}{s-t}\int_t^s \mathbf{v}(\mathbf{x}_u, u)\,\mathrm{d}u\Bigr]}_{\approx\,\mathbf{h}_\theta}" />
            </section>

            <section>
              <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">
                Conclusion
              </h2>

              <p className="leading-relaxed text-slate-700">
                Modern diffusion models can look like a zoo of acronyms, but the underlying story is surprisingly simple. At heart, they are all ways to <em>transport probability mass</em> from a simple Gaussian distribution to the complicated data distribution progressively.
              </p>

              <p className="leading-relaxed text-slate-700">
                The big takeaway is optimistic: diffusion models are not a single method, but a <em>principle for building generators</em> from a prescribed forward path. Once we commit to "choose a forward corruption, then learn its reverse transport", there is room for many designs that trade off <em>stability</em>, <em>fidelity</em>, and <em>speed</em>.
              </p>

              <p className="leading-relaxed text-slate-700">
                Flow maps are one promising direction for fast generation. The exciting open space is to keep the same clean backbone while looking for new parameterizations and objectives that make fast generation as reliable as the best step-by-step samplers.
              </p>
            </section>
          </div>
        </article>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
