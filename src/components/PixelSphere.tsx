"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { ScanSearch, X } from 'lucide-react';
import {
  CATEGORY_COLORS,
  CATEGORY_LIST,
  KNOWLEDGE_DATA,
  type KnowledgeCategory,
} from '@/data/knowledge';

interface PixelSphereProps {
  size?: number;
  selectedKnowledgeId?: string | null;
  onDotClick?: (knowledgeId: string) => void;
  onDeselect?: () => void;
  onInspect?: (knowledgeId: string) => void;
}

interface SpherePoint {
  x: number;
  y: number;
  z: number;
  color: number[];
  category: KnowledgeCategory;
  knowledgeId: string;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
  color: number[];
  category: KnowledgeCategory;
  knowledgeId: string;
  origX: number;
  origY: number;
  origZ: number;
}

/**
 * Generate sphere points using semantic clustering based on text embeddings
 * 
 * Position Algorithm:
 * 1. Generate text embeddings using Xenova/all-MiniLM-L6-v2 model
 * 2. Compute cosine similarity between all knowledge entries
 * 3. Apply PCA dimensionality reduction from 384D → 3D
 * 4. Normalize to unit sphere surface
 * 
 * Result: Knowledge entries with similar content cluster together in 3D space,
 * independent of their category labels. This creates organic semantic neighborhoods.
 */
function generatePoints(): SpherePoint[] {
  const pts: SpherePoint[] = [];

  // Use precomputed positions from embeddings (computed at build time)
  for (const knowledge of KNOWLEDGE_DATA) {
    const color = CATEGORY_COLORS[knowledge.category];
    
    if (knowledge.position) {
      // Position determined by semantic similarity (cosine distance in embedding space)
      pts.push({
        x: knowledge.position.x,
        y: knowledge.position.y,
        z: knowledge.position.z,
        color,
        category: knowledge.category,
        knowledgeId: knowledge.id,
      });
    } else {
      // Fallback: should never happen in production (positions are precomputed)
      console.warn(`Missing position for knowledge ${knowledge.id}, using fallback`);
      pts.push({
        x: 0,
        y: 1,
        z: 0,
        color,
        category: knowledge.category,
        knowledgeId: knowledge.id,
      });
    }
  }

  return pts;
}

export default function PixelSphere({
  size = 300,
  selectedKnowledgeId = null,
  onDotClick,
  onDeselect,
  onInspect,
}: PixelSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const inspectBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const [displayedTitle, setDisplayedTitle] = useState('');
  const [targetTitle, setTargetTitle] = useState('');

  // Store the selected ID in a ref so the render loop can read it without re-creating
  const selectedIdRef = useRef<string | null>(selectedKnowledgeId);
  selectedIdRef.current = selectedKnowledgeId;

  const onDotClickRef = useRef(onDotClick);
  onDotClickRef.current = onDotClick;
  const onDeselectRef = useRef(onDeselect);
  onDeselectRef.current = onDeselect;
  const onInspectRef = useRef(onInspect);
  onInspectRef.current = onInspect;

  // Mutable state for the animation loop
  const state = useRef({
    rotX: 0,
    rotY: 0,
    velX: 0,
    velY: 0.01,
    isDragging: false,
    isHovering: false,
    lastX: 0,
    lastY: 0,
    mouseX: -1000,
    mouseY: -1000,
    // Zoom/focus animation targets
    targetRotX: 0,
    targetRotY: 0,
    targetFov: 3.5,
    currentFov: 3.5,
    isFocused: false,
    focusedCategory: null as KnowledgeCategory | null,
    focusedKnowledgeId: null as string | null,
    // Dim animation (0 = no dim, 1 = fully dimmed)
    dimAmount: 0,
    targetDimAmount: 0,
    // Hover category highlight
    hoveredCategory: null as KnowledgeCategory | null,
    hoverDimAmount: 0,
    // Selected dot screen position (for inspect button placement)
    selectedScreenX: 0,
    selectedScreenY: 0,
    selectedVisible: false,
    // Click tracking
    pointerDownX: 0,
    pointerDownY: 0,
    pointerDownTime: 0,
  });

  // Stable point data
  const points = useRef<SpherePoint[]>(generatePoints());
  
  // Physics: displacement offsets and velocities for each particle
  const displacements = useRef<{ dx: number; dy: number; dz: number; vx: number; vy: number; vz: number }[]>(
    points.current.map(() => ({ dx: 0, dy: 0, dz: 0, vx: 0, vy: 0, vz: 0 }))
  );

  // Find target rotation to bring a specific knowledge dot to the front face
  // Front face = z2 = -1 (closest to camera in perspective projection)
  const findTargetRotation = useCallback((knowledgeId: string) => {
    const point = points.current.find((p) => p.knowledgeId === knowledgeId);
    if (!point) return null;

    const { x: px, y: py, z: pz } = point;

    // rotX (pitch) to bring y toward equator
    const rotX = Math.atan2(py, pz);

    // compute z1 with rotX
    const z1 = py * Math.sin(rotX) + pz * Math.cos(rotX);

    // Step 3: rotY (yaw) to bring point to front (z2 negative, closest to camera)
    // Choosing the quadrant where z2 = -(px² + z1²)/r = -1
    const rotY = Math.atan2(-px, -z1);

    return { rotX, rotY };
  }, []);

  // Update focus state when selectedKnowledgeId changes
  useEffect(() => {
    const s = state.current;

    if (selectedKnowledgeId) {
      const target = findTargetRotation(selectedKnowledgeId);
      if (target) {
        s.targetRotX = target.rotX;
        s.targetRotY = target.rotY;
        
        // Stage 1: Just focus and start rotating to the dot (isFocused=true handles rotation)
        s.isFocused = true;
        
        // Stage 2: Dim other categories after 600ms (let rotation finish first)
        setTimeout(() => {
          if (state.current.focusedKnowledgeId === selectedKnowledgeId) {
            state.current.targetDimAmount = 1;
          }
        }, 600);

        // Stage 3: Zoom in after 1200ms (let dimming finish first)
        setTimeout(() => {
          if (state.current.focusedKnowledgeId === selectedKnowledgeId) {
            state.current.targetFov = 1.3; // Increased zoom
          }
        }, 1200);

        // Find the category of the selected knowledge
        const knowledge = KNOWLEDGE_DATA.find((k) => k.id === selectedKnowledgeId);
        s.focusedCategory = knowledge?.category ?? null;
        s.focusedKnowledgeId = selectedKnowledgeId;

        // Set target title for typewriter
        setTargetTitle(knowledge?.title ?? '');
        setDisplayedTitle('');

        // Kill momentum when focusing
        s.velX = 0;
        s.velY = 0;
      }
    } else {
      s.targetFov = 3.5; // Zoom out
      s.isFocused = false;
      s.focusedCategory = null;
      s.focusedKnowledgeId = null;
      s.targetDimAmount = 0;
      s.selectedVisible = false;
      setTargetTitle('');
      setDisplayedTitle('');
    }
  }, [selectedKnowledgeId, findTargetRotation]);

  // Typewriter effect
  useEffect(() => {
    if (targetTitle.length === 0) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= targetTitle.length) {
        setDisplayedTitle(targetTitle.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [targetTitle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;

    ctx.imageSmoothingEnabled = false;

    const width = canvas.width;
    const height = canvas.height;
    const baseSize = 4;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const s = state.current;

      // Lerp FOV - slower zoom
      s.currentFov += (s.targetFov - s.currentFov) * 0.04;

      // Lerp dim amount - slower fade
      s.dimAmount += (s.targetDimAmount - s.dimAmount) * 0.06;

      if (s.isFocused && !s.isDragging) {
        // Lerp rotation toward target — slower, smoother transition
        // Handle angle wrapping for rotY
        let dRotY = s.targetRotY - s.rotY;
        // Normalize to [-PI, PI]
        while (dRotY > Math.PI) dRotY -= 2 * Math.PI;
        while (dRotY < -Math.PI) dRotY += 2 * Math.PI;
        s.rotY += dRotY * 0.05; // Was 0.12

        const dRotX = s.targetRotX - s.rotX;
        s.rotX += dRotX * 0.05; // Was 0.12

        s.velX = 0;
        s.velY = 0;
      } else if (!s.isDragging) {
        // Normal auto-rotation and momentum
        s.velX *= 0.95;
        if (s.isHovering) {
          s.velY *= 0.95;
        } else {
          s.velY = s.velY * 0.95 + 0.005 * 0.05;
        }
        s.rotX += s.velX;
        s.rotY += s.velY;
      }

      const cosX = Math.cos(s.rotX);
      const sinX = Math.sin(s.rotX);
      const cosY = Math.cos(s.rotY);
      const sinY = Math.sin(s.rotY);

      const fov = s.currentFov;

      // Physics constants
      const repulsionRadius = 60; // Screen pixels
      const repulsionStrength = 0.015;
      const springStrength = 0.06;
      const damping = 0.9;
      const maxDisplacement = 0.15;

      const projected: ProjectedPoint[] = [];

      for (let i = 0; i < points.current.length; i++) {
        const p = points.current[i];
        const d = displacements.current[i];

        // Apply displacement to get current position
        const px = p.x + d.dx;
        const py = p.y + d.dy;
        const pz = p.z + d.dz;

        const y1 = py * cosX - pz * sinX;
        const z1 = py * sinX + pz * cosX;
        const x2 = px * cosY - z1 * sinY;
        const z2 = px * sinY + z1 * cosY;
        const y2 = y1;

        const scale = fov / (fov + z2);
        const x3d = x2 * scale * width * 0.45 + width / 2;
        const y3d = y2 * scale * height * 0.45 + height / 2;

        projected.push({
          x: x3d,
          y: y3d,
          z: z2,
          scale,
          color: p.color,
          category: p.category,
          knowledgeId: p.knowledgeId,
          origX: p.x,
          origY: p.y,
          origZ: p.z,
        });
      }

      // Sort back to front
      projected.sort((a, b) => b.z - a.z);

      let hoveredPoint: ProjectedPoint | null = null;
      let hoveredIndex = -1;
      let minMouseDist = 25;

      // Find hovered point
      if (!s.isDragging) {
        for (let i = projected.length - 1; i >= 0; i--) {
          const p = projected[i];
          const dx = p.x - s.mouseX;
          const dy = p.y - s.mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minMouseDist) {
            minMouseDist = dist;
            hoveredPoint = p;
            // Find original index
            hoveredIndex = points.current.findIndex(pt => pt.knowledgeId === p.knowledgeId);
          }
        }
      }

      s.isHovering = !!hoveredPoint;
      
      // Track hovered category for highlighting
      if (hoveredPoint && !s.isFocused) {
        s.hoveredCategory = hoveredPoint.category;
      } else if (!hoveredPoint) {
        s.hoveredCategory = null;
      }
      
      // Animate hover dim amount
      const targetHoverDim = s.hoveredCategory ? 0.6 : 0;
      s.hoverDimAmount += (targetHoverDim - s.hoverDimAmount) * 0.15;

      // Physics-based repulsion from cursor
      for (let i = 0; i < points.current.length; i++) {
        const p = points.current[i];
        const d = displacements.current[i];
        const proj = projected.find(pt => pt.knowledgeId === p.knowledgeId);
        if (!proj) continue;

        // Calculate screen distance from cursor
        const screenDx = proj.x - s.mouseX;
        const screenDy = proj.y - s.mouseY;
        const screenDist = Math.sqrt(screenDx * screenDx + screenDy * screenDy);

        // Apply repulsion force if within radius
        if (screenDist < repulsionRadius && screenDist > 1) {
          const force = Math.pow((repulsionRadius - screenDist) / repulsionRadius, 2) * repulsionStrength;
          
          // Convert screen-space direction to 3D force
          // Normalize and scale by depth
          const depthFactor = 1 / (proj.scale + 0.5);
          const forceX = (screenDx / screenDist) * force * depthFactor;
          const forceY = (screenDy / screenDist) * force * depthFactor;
          
          // Apply force to velocity (in world space, approximate)
          d.vx += forceX * Math.cos(-s.rotY) - forceY * Math.sin(-s.rotX) * Math.sin(-s.rotY);
          d.vy += forceY * Math.cos(-s.rotX);
          d.vz += -forceX * Math.sin(-s.rotY) - forceY * Math.sin(-s.rotX) * Math.cos(-s.rotY);
        }

        // Spring force back to origin
        d.vx -= d.dx * springStrength;
        d.vy -= d.dy * springStrength;
        d.vz -= d.dz * springStrength;

        // Apply damping
        d.vx *= damping;
        d.vy *= damping;
        d.vz *= damping;

        // Update displacement
        d.dx += d.vx;
        d.dy += d.vy;
        d.dz += d.vz;

        // Clamp displacement to prevent particles flying too far
        const dispMag = Math.sqrt(d.dx * d.dx + d.dy * d.dy + d.dz * d.dz);
        if (dispMag > maxDisplacement) {
          const scale = maxDisplacement / dispMag;
          d.dx *= scale;
          d.dy *= scale;
          d.dz *= scale;
        }
      }

      // ── Find the single selected dot (front-most with matching knowledgeId) ──
      let primarySelectedDot: ProjectedPoint | null = null;
      if (s.focusedKnowledgeId) {
        for (let i = projected.length - 1; i >= 0; i--) {
          if (projected[i].knowledgeId === s.focusedKnowledgeId) {
            primarySelectedDot = projected[i];
            break;
          }
        }
      }

      // ── Render dots ──────────────────────────────────
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const isHovered = p === hoveredPoint;
        const isPrimarySelected = p === primarySelectedDot;
        const isSameCategory = p.category === s.focusedCategory;
        const isHoveredCategory = p.category === s.hoveredCategory;
        const isDimming = s.dimAmount > 0.01;
        const isHoverDimming = s.hoverDimAmount > 0.01;

        // Base depth-based opacity
        let opacity = Math.max(0.1, Math.min(1, (1 - p.z) / 2));

        // Apply dimming to non-selected dots (when focused/selected)
        if (isDimming && !isPrimarySelected) {
          if (isSameCategory) {
            opacity = opacity * (1 - s.dimAmount * 0.4);
          } else {
            opacity = opacity * (1 - s.dimAmount * 0.95);
          }
        }
        
        // Apply hover category highlighting (dim other categories)
        if (isHoverDimming && !isDimming && !isHovered) {
          if (isHoveredCategory) {
            // Boost opacity for same category
            opacity = Math.min(1, opacity * (1 + s.hoverDimAmount * 0.3));
          } else {
            // Dim other categories
            opacity = opacity * (1 - s.hoverDimAmount * 0.7);
          }
        }

        // Apply a global dimming effect when zoomed in (to replace the brightness pulse)
        if (s.currentFov < 3.0) {
          // Normalize FOV between 3.5 (zoomed out) and 1.3 (zoomed in)
          // 0 = zoomed out, 1 = fully zoomed in
          const zoomProgress = Math.max(0, Math.min(1, (3.5 - s.currentFov) / (3.5 - 1.3)));
          // Decrease brightness/opacity globally based on zoom progress
          // The selected dot keeps its glow, but everything else gets slightly darker
          if (!isPrimarySelected) {
             opacity = opacity * (1 - zoomProgress * 0.4); 
          }
        }

        const [r, g, b] = p.color;

        // Size boost based on votes (higher upvotes = larger dot)
        const k = KNOWLEDGE_DATA.find(item => item.id === p.knowledgeId);
        const netScore = k ? k.upvotes - k.downvotes : 0;
        const voteBoost = 1 + Math.min(Math.max(netScore, 0) / 200, 1.5); // Cap at 2.5x
        
        let dotSize = Math.max(1, Math.round(p.scale * baseSize * voteBoost));

        if (isPrimarySelected) {
          // Glow effect - draw multiple layers using category color
          const glowLayers = [
            { size: 24, alpha: 0.08 },
            { size: 18, alpha: 0.12 },
            { size: 14, alpha: 0.2 },
            { size: 10, alpha: 0.4 },
          ];
          for (const layer of glowLayers) {
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${layer.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, layer.size, 0, Math.PI * 2);
            ctx.fill();
          }
          // Core dot
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
          dotSize = 8;
        } else if (isHovered) {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
          dotSize *= 2.5;
        } else {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }

        ctx.fillRect(
          Math.round(p.x - dotSize / 2),
          Math.round(p.y - dotSize / 2),
          dotSize,
          dotSize
        );
      }

      // ── Track selected dot screen position for inspect button ──
      {
        let foundSelected = false;
        if (s.focusedKnowledgeId) {
          for (let i = projected.length - 1; i >= 0; i--) {
            const p = projected[i];
            if (p.knowledgeId === s.focusedKnowledgeId) {
              s.selectedScreenX = p.x;
              s.selectedScreenY = p.y;
              s.selectedVisible = p.z < 0.5; // only show button when dot is on front face
              foundSelected = true;
              break;
            }
          }
        }
        if (!foundSelected) {
          s.selectedVisible = false;
        }
      }

      // ── Position inspect button ──
      if (inspectBtnRef.current) {
        if (s.selectedVisible && s.dimAmount > 0.5) {
          inspectBtnRef.current.style.opacity = '1';
          inspectBtnRef.current.style.pointerEvents = 'auto';
          // Position to the right of the selected dot
          const btnX = Math.min(s.selectedScreenX + 25, width - 130);
          const btnY = Math.max(s.selectedScreenY - 12, 10);
          inspectBtnRef.current.style.transform = `translate(${btnX}px, ${btnY}px)`;
        } else {
          inspectBtnRef.current.style.opacity = '0';
          inspectBtnRef.current.style.pointerEvents = 'none';
        }
      }

      // ── Position close button ──
      if (closeBtnRef.current) {
        if (s.selectedVisible && s.dimAmount > 0.5) {
          closeBtnRef.current.style.opacity = '1';
          closeBtnRef.current.style.pointerEvents = 'auto';
          // Position to the right of the inspect button
          const btnX = Math.min(s.selectedScreenX + 110, width - 40);
          const btnY = Math.max(s.selectedScreenY - 12, 10);
          closeBtnRef.current.style.transform = `translate(${btnX}px, ${btnY}px)`;
        } else {
          closeBtnRef.current.style.opacity = '0';
          closeBtnRef.current.style.pointerEvents = 'none';
        }
      }

      // ── Position title text ──
      if (titleRef.current) {
        if (s.selectedVisible && s.dimAmount > 0.5) {
          titleRef.current.style.opacity = '1';
          // Position above the dot
          const titleX = s.selectedScreenX;
          const titleY = Math.max(s.selectedScreenY - 30, 20);
          titleRef.current.style.transform = `translate(-50%, -100%) translate(${titleX}px, ${titleY}px)`;
        } else {
          titleRef.current.style.opacity = '0';
        }
      }

      // ── Tooltip ──────────────────────────────────────
      if (tooltipRef.current) {
        let tooltipKnowledge: typeof KNOWLEDGE_DATA[0] | undefined;
        let tooltipX = 0;
        let tooltipY = 0;
        let tooltipCategory = '';
        let showTooltip = false;

        if (hoveredPoint && hoveredPoint.knowledgeId !== s.focusedKnowledgeId) {
          // Show tooltip for hovered knowledge (but not for the selected one)
          tooltipKnowledge = KNOWLEDGE_DATA.find((k) => k.id === hoveredPoint.knowledgeId);
          tooltipX = hoveredPoint.x;
          tooltipY = hoveredPoint.y;
          tooltipCategory = hoveredPoint.category;
          showTooltip = true;
        }

        if (showTooltip && tooltipKnowledge) {
          tooltipRef.current.style.opacity = '1';
          tooltipRef.current.style.transform = `translate(${tooltipX + 15}px, ${tooltipY + 15}px)`;

          let extraBadges = '';
          let bigLock = '';
          if (tooltipKnowledge.isGated) {
            extraBadges += `<div class="text-[9px] font-mono text-emerald-400 font-bold mt-1 bg-emerald-400/10 px-1 py-0.5 rounded w-fit flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> $${tooltipKnowledge.price?.toFixed(2)} USD (x402)</div>`;
            tooltipRef.current.style.boxShadow = '0 0 15px rgba(52, 211, 153, 0.4)';
            tooltipRef.current.style.borderColor = 'rgba(52, 211, 153, 0.4)';
            bigLock = `<div class="absolute top-2 right-2 text-white/20"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>`;
          } else {
            tooltipRef.current.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
            tooltipRef.current.style.borderColor = 'rgba(55, 65, 81, 1)';
          }
          
          // Vote ratio bar
          const total = tooltipKnowledge.upvotes + tooltipKnowledge.downvotes;
          const upPercent = total > 0 ? Math.round((tooltipKnowledge.upvotes / total) * 100) : 50;
          extraBadges += `<div class="mt-2 w-full">
            <div class="flex justify-between text-[8px] font-mono text-white/50 mb-0.5">
              <span>▲${tooltipKnowledge.upvotes}</span>
              <span>${tooltipKnowledge.downvotes}▼</span>
            </div>
            <div class="h-1.5 w-full bg-red-500/30 rounded-full overflow-hidden flex">
              <div class="bg-green-400 h-full" style="width:${upPercent}%"></div>
            </div>
          </div>`;

          const actionText = 'Click to inspect';
          tooltipRef.current.innerHTML = `
            ${bigLock}
            <div class="font-bold text-white" style="font-size:11px">${tooltipCategory}</div>
            <div class="text-xs text-white/90 mt-1" style="max-width:180px;font-size:10px">${tooltipKnowledge.title}</div>
            ${extraBadges}
            <div class="text-xs mt-1" style="color:rgba(255,255,255,0.5);font-size:9px">${actionText}</div>
          `;
        } else {
          tooltipRef.current.style.opacity = '0';
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    state.current.isDragging = true;
    state.current.lastX = e.clientX;
    state.current.lastY = e.clientY;
    state.current.pointerDownX = e.clientX;
    state.current.pointerDownY = e.clientY;
    state.current.pointerDownTime = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      state.current.mouseX = e.clientX - rect.left;
      state.current.mouseY = e.clientY - rect.top;
    }

    if (!state.current.isDragging) return;
    const dx = e.clientX - state.current.lastX;
    const dy = e.clientY - state.current.lastY;

    state.current.rotY += dx * 0.005;
    state.current.rotX += dy * 0.005;

    state.current.lastX = e.clientX;
    state.current.lastY = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = state.current;
    const dx = Math.abs(e.clientX - s.pointerDownX);
    const dy = Math.abs(e.clientY - s.pointerDownY);
    const dt = Date.now() - s.pointerDownTime;

    s.isDragging = false;

    // Detect click (minimal movement, short duration)
    if (dx < 5 && dy < 5 && dt < 300) {
      handleClick(e);
    }
  };

  const handleClick = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const s = state.current;
    const cosX = Math.cos(s.rotX);
    const sinX = Math.sin(s.rotX);
    const cosY = Math.cos(s.rotY);
    const sinY = Math.sin(s.rotY);
    const fov = s.currentFov;
    const width = size;
    const height = size;

    // Single-pass: find nearest dot (skip other-category dots when focused)
    let bestDot: SpherePoint | null = null;
    let bestDist = 20;

    const focusedCat = s.focusedCategory;

    for (const p of points.current) {
      // Skip other-category dots when focused on a category
      if (focusedCat && p.category !== focusedCat) continue;

      const y1 = p.y * cosX - p.z * sinX;
      const z1 = p.y * sinX + p.z * cosX;
      const x2 = p.x * cosY - z1 * sinY;
      const z2 = p.x * sinY + z1 * cosY;
      const y2 = y1;

      if (z2 > 0.8) continue;

      const scale = fov / (fov + z2);
      const x3d = x2 * scale * width * 0.45 + width / 2;
      const y3d = y2 * scale * height * 0.45 + height / 2;

      const dx = x3d - mx;
      const dy = y3d - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bestDist) {
        bestDist = dist;
        bestDot = p;
      }
    }

    if (bestDot?.knowledgeId) {
      onDotClickRef.current?.(bestDot.knowledgeId);
    } else if (!bestDot) {
      // Clicked empty space — deselect
      onDeselectRef.current?.();
    }
  };

  const handlePointerLeave = () => {
    state.current.isDragging = false;
    state.current.mouseX = -1000;
    state.current.mouseY = -1000;
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="cursor-grab active:cursor-grabbing"
      />
      <div
        ref={tooltipRef}
        className="absolute top-0 left-0 pointer-events-none bg-gray-900/90 border border-gray-700 p-3 rounded-lg shadow-xl backdrop-blur-sm transition-opacity duration-150 opacity-0 z-10"
        style={{ willChange: 'transform' }}
      ></div>
      {/* Inspect button — positioned by the render loop next to the selected dot */}
      <button
        ref={inspectBtnRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none z-20 flex items-center h-8 gap-1.5 px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 text-black border-2 border-white hover:bg-primary hover:border-primary transition-all duration-150 rounded cursor-pointer shadow-[0_0_16px_rgba(255,255,255,0.3)]"
        style={{ willChange: 'transform' }}
        onClick={(e) => {
          e.stopPropagation();
          if (state.current.focusedKnowledgeId) {
            onInspectRef.current?.(state.current.focusedKnowledgeId);
          }
        }}
      >
        <ScanSearch size={14} strokeWidth={2.5} />
        Inspect
      </button>
      {/* Title display — positioned above the selected dot */}
      <div
        ref={titleRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none z-20 text-center pointer-events-none"
        style={{ willChange: 'transform' }}
      >
        <div className="bg-black/80 backdrop-blur-sm border border-primary/30 px-3 py-2 rounded text-xs font-mono text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] min-w-[120px] max-w-[280px]">
          {displayedTitle}
          {targetTitle.length > 0 && displayedTitle.length < targetTitle.length && (
            <span className="inline-block w-2 h-3 ml-1 bg-primary animate-pulse align-middle"></span>
          )}
        </div>
        {/* Triangle pointer */}
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary/50 mx-auto mt-0.5 relative z-10"></div>
      </div>
      {/* Close button — positioned by the render loop to the right of the inspect button */}
      <button
        ref={closeBtnRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none z-20 flex items-center justify-center h-8 w-8 text-xs font-bold bg-black/80 text-white border-2 border-white/50 hover:bg-red-500 hover:border-red-500 transition-all duration-150 rounded cursor-pointer shadow-[0_0_12px_rgba(0,0,0,0.5)]"
        style={{ willChange: 'transform' }}
        onClick={(e) => {
          e.stopPropagation();
          onDeselectRef.current?.();
        }}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
