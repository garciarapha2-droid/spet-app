import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ArrowLeft, DollarSign, Users, ShoppingBag, Repeat, Music, TrendingUp,
  BarChart3, Package, ArrowUpDown, Heart, Sparkles, Target, ChevronRight, X
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
};

const tooltipStyle = {
  contentStyle: { backgroundColor: '#FFFFFF', border: '1px solid #E6E8EC', borderRadius: '8px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', color: '#111827' }
};

/* ── Genre Data ── */
const G = {
  techno: {
    name: 'Techno', revenue: 68000, guests: 4200, avgSpend: 16.3, retention: 32, events: 14, growth: 14,
    categories: [
      { name: 'Cocktails', revenue: 28.4, volume: 4200, margin: 42, brands: [
        { name: 'Espresso Martini', revenue: 8.2, volume: 1200, avg: 6.8, margin: 48, share: 29 },
        { name: 'Vodka Soda', revenue: 6.8, volume: 980, avg: 6.9, margin: 44, share: 24 },
        { name: 'Gin & Tonic', revenue: 7.1, volume: 860, avg: 8.3, margin: 52, share: 25 },
        { name: 'Rum Runner', revenue: 3.6, volume: 640, avg: 5.6, margin: 38, share: 13 },
      ]},
      { name: 'Spirits', revenue: 18.6, volume: 2100, margin: 55, brands: [
        { name: 'Grey Goose', revenue: 6.4, volume: 420, avg: 15.2, margin: 58, share: 34 },
        { name: 'Absolut', revenue: 5.2, volume: 680, avg: 7.6, margin: 52, share: 28 },
        { name: 'Jameson', revenue: 4.1, volume: 540, avg: 7.6, margin: 50, share: 22 },
      ]},
      { name: 'Beer', revenue: 12.2, volume: 3400, margin: 35, brands: [
        { name: 'Heineken', revenue: 4.8, volume: 1400, avg: 3.4, margin: 38, share: 39 },
        { name: 'Corona', revenue: 3.6, volume: 1000, avg: 3.6, margin: 35, share: 30 },
        { name: 'Craft IPA', revenue: 3.8, volume: 1000, avg: 3.8, margin: 32, share: 31 },
      ]},
      { name: 'Food', revenue: 5.8, volume: 1800, margin: 28, brands: [
        { name: 'Nachos', revenue: 2.4, volume: 800, avg: 3.0, margin: 30, share: 41 },
        { name: 'Wings', revenue: 2.0, volume: 600, avg: 3.3, margin: 26, share: 35 },
        { name: 'Sliders', revenue: 1.4, volume: 400, avg: 3.5, margin: 28, share: 24 },
      ]},
      { name: 'Wine', revenue: 3.0, volume: 400, margin: 48, brands: [
        { name: 'Prosecco', revenue: 1.8, volume: 240, avg: 7.5, margin: 50, share: 60 },
        { name: 'Pinot Grigio', revenue: 1.2, volume: 160, avg: 7.5, margin: 45, share: 40 },
      ]},
    ],
    behavior: { returning: 32, loyaltyAdoption: 28, vipShare: 8, peakHours: '11PM–2AM' },
    age: [{ range: '18–24', pct: 42 }, { range: '25–34', pct: 38 }, { range: '35–44', pct: 14 }, { range: '45+', pct: 6 }],
    gender: [{ name: 'Male', value: 62, color: '#3B82F6' }, { name: 'Female', value: 30, color: '#F59E0B' }, { name: 'Not specified', value: 8, color: '#F0F1F3' }],
    genderRet: { male: 35, female: 28 },
    insights: ['Espresso Martini sales up 22% — consider featured cocktail placement', '18–24 cohort drives 42% of attendance but only 28% of revenue', 'Peak entry at 11:30PM — delay headline DJ by 15min to capture more bar spend', 'Male audience 2.1x more likely to buy spirits over cocktails'],
    actions: [{ title: 'Launch "Techno Tuesdays" loyalty perk', impact: '+$8K/mo', detail: 'Retain 32% returning audience with midweek incentive' }, { title: 'Introduce premium cocktail menu', impact: '+$4.2K/mo', detail: 'Avg spend lift for 25-34 age group' }, { title: 'Partner with local DJ collective', impact: '+$3.5K/mo', detail: 'Drive new guest acquisition through artist fanbase' }],
  },
  house: {
    name: 'House', revenue: 58000, guests: 2800, avgSpend: 20.8, retention: 28, events: 12, growth: 8,
    categories: [
      { name: 'Cocktails', revenue: 24.2, volume: 3200, margin: 44, brands: [
        { name: 'Aperol Spritz', revenue: 8.4, volume: 1100, avg: 7.6, margin: 46, share: 35 },
        { name: 'Negroni', revenue: 6.2, volume: 720, avg: 8.6, margin: 50, share: 26 },
        { name: 'Mojito', revenue: 5.8, volume: 840, avg: 6.9, margin: 42, share: 24 },
        { name: 'Daiquiri', revenue: 3.8, volume: 540, avg: 7.0, margin: 40, share: 15 },
      ]},
      { name: 'Wine', revenue: 14.8, volume: 1600, margin: 50, brands: [
        { name: 'Prosecco', revenue: 6.2, volume: 680, avg: 9.1, margin: 52, share: 42 },
        { name: 'Rosé', revenue: 4.8, volume: 480, avg: 10.0, margin: 48, share: 32 },
        { name: 'Pinot Noir', revenue: 3.8, volume: 440, avg: 8.6, margin: 50, share: 26 },
      ]},
      { name: 'Spirits', revenue: 10.4, volume: 1200, margin: 52, brands: [
        { name: 'Hendricks Gin', revenue: 4.2, volume: 360, avg: 11.7, margin: 55, share: 40 },
        { name: 'Tanqueray', revenue: 3.4, volume: 480, avg: 7.1, margin: 50, share: 33 },
        { name: 'Campari', revenue: 2.8, volume: 360, avg: 7.8, margin: 48, share: 27 },
      ]},
      { name: 'Food', revenue: 5.2, volume: 1400, margin: 30, brands: [
        { name: 'Cheese Board', revenue: 2.4, volume: 480, avg: 5.0, margin: 32, share: 46 },
        { name: 'Bruschetta', revenue: 1.6, volume: 520, avg: 3.1, margin: 28, share: 31 },
        { name: 'Olives & Nuts', revenue: 1.2, volume: 400, avg: 3.0, margin: 30, share: 23 },
      ]},
      { name: 'Beer', revenue: 3.4, volume: 800, margin: 32, brands: [
        { name: 'Peroni', revenue: 2.0, volume: 500, avg: 4.0, margin: 34, share: 59 },
        { name: 'Moretti', revenue: 1.4, volume: 300, avg: 4.7, margin: 30, share: 41 },
      ]},
    ],
    behavior: { returning: 28, loyaltyAdoption: 32, vipShare: 12, peakHours: '10PM–1AM' },
    age: [{ range: '18–24', pct: 22 }, { range: '25–34', pct: 45 }, { range: '35–44', pct: 24 }, { range: '45+', pct: 9 }],
    gender: [{ name: 'Male', value: 48, color: '#3B82F6' }, { name: 'Female', value: 44, color: '#F59E0B' }, { name: 'Not specified', value: 8, color: '#F0F1F3' }],
    genderRet: { male: 26, female: 30 },
    insights: ['Aperol Spritz dominates cocktails — bundle with food for higher check', '25-34 demo prefers premium wines and craft cocktails', 'Female audience retention 15% higher than male — lean into this', 'Saturday 10-11PM is the revenue peak window'],
    actions: [{ title: 'Create "House Brunch" Sunday concept', impact: '+$6K/mo', detail: 'Leverage 25-34 audience for daytime crossover' }, { title: 'Wine tasting loyalty tier', impact: '+$3.8K/mo', detail: 'High-margin category with engaged demo' }, { title: 'Expand food menu for pairing', impact: '+$2.4K/mo', detail: 'Increase check size via cocktail-food combos' }],
  },
  hiphop: {
    name: 'Hip Hop', revenue: 43000, guests: 3600, avgSpend: 11.9, retention: 15, events: 10, growth: -4,
    categories: [
      { name: 'Spirits', revenue: 18.2, volume: 2800, margin: 50, brands: [
        { name: 'Hennessy', revenue: 7.8, volume: 1100, avg: 7.1, margin: 52, share: 43 },
        { name: 'Ciroc', revenue: 4.6, volume: 620, avg: 7.4, margin: 48, share: 25 },
        { name: 'Don Julio', revenue: 3.4, volume: 480, avg: 7.1, margin: 55, share: 19 },
        { name: 'Jack Daniels', revenue: 2.4, volume: 600, avg: 4.0, margin: 45, share: 13 },
      ]},
      { name: 'Cocktails', revenue: 10.8, volume: 1800, margin: 38, brands: [
        { name: 'Long Island', revenue: 4.2, volume: 680, avg: 6.2, margin: 40, share: 39 },
        { name: 'Margarita', revenue: 3.6, volume: 600, avg: 6.0, margin: 38, share: 33 },
        { name: 'Rum Punch', revenue: 3.0, volume: 520, avg: 5.8, margin: 35, share: 28 },
      ]},
      { name: 'Beer', revenue: 8.4, volume: 3200, margin: 30, brands: [
        { name: 'Bud Light', revenue: 3.2, volume: 1400, avg: 2.3, margin: 32, share: 38 },
        { name: 'Corona', revenue: 2.8, volume: 1000, avg: 2.8, margin: 30, share: 33 },
        { name: 'Modelo', revenue: 2.4, volume: 800, avg: 3.0, margin: 28, share: 29 },
      ]},
      { name: 'Food', revenue: 3.8, volume: 1600, margin: 25, brands: [
        { name: 'Wings', revenue: 1.8, volume: 800, avg: 2.3, margin: 26, share: 47 },
        { name: 'Fries', revenue: 1.2, volume: 500, avg: 2.4, margin: 24, share: 32 },
        { name: 'Sliders', revenue: 0.8, volume: 300, avg: 2.7, margin: 25, share: 21 },
      ]},
      { name: 'VIP Packages', revenue: 1.8, volume: 40, margin: 62, brands: [
        { name: 'Bottle Service', revenue: 1.8, volume: 40, avg: 45.0, margin: 62, share: 100 },
      ]},
    ],
    behavior: { returning: 15, loyaltyAdoption: 12, vipShare: 4, peakHours: '11PM–2:30AM' },
    age: [{ range: '18–24', pct: 48 }, { range: '25–34', pct: 35 }, { range: '35–44', pct: 12 }, { range: '45+', pct: 5 }],
    gender: [{ name: 'Male', value: 64, color: '#3B82F6' }, { name: 'Female', value: 28, color: '#F59E0B' }, { name: 'Not specified', value: 8, color: '#F0F1F3' }],
    genderRet: { male: 14, female: 17 },
    insights: ['Retention at 15% is lowest across all genres — loyalty gap', 'Hennessy alone drives 43% of spirits revenue — stock risk', '18-24 cohort dominates (48%) but avg spend is lowest', 'Bottle service has highest margin (62%) but low volume'],
    actions: [{ title: 'Launch Hip Hop loyalty card', impact: '+$5.2K/mo', detail: 'Address 15% retention with points-per-visit model' }, { title: 'Guest DJ partnerships', impact: '+$3.8K/mo', detail: 'Drive retention through artist-led recurring events' }, { title: 'Promote VIP bottle packages', impact: '+$2.8K/mo', detail: 'Scale 62% margin product to 25-34 demo' }],
  },
  latin: {
    name: 'Latin', revenue: 32000, guests: 1800, avgSpend: 18, retention: 34, events: 10, growth: 18,
    categories: [
      { name: 'Cocktails', revenue: 14.6, volume: 2400, margin: 44, brands: [
        { name: 'Margarita', revenue: 5.8, volume: 920, avg: 6.3, margin: 46, share: 40 },
        { name: 'Mojito', revenue: 4.2, volume: 680, avg: 6.2, margin: 42, share: 29 },
        { name: 'Piña Colada', revenue: 2.8, volume: 480, avg: 5.8, margin: 40, share: 19 },
        { name: 'Caipirinha', revenue: 1.8, volume: 320, avg: 5.6, margin: 48, share: 12 },
      ]},
      { name: 'Spirits', revenue: 8.4, volume: 1000, margin: 52, brands: [
        { name: 'Patrón', revenue: 3.6, volume: 360, avg: 10.0, margin: 54, share: 43 },
        { name: 'Don Julio', revenue: 2.8, volume: 340, avg: 8.2, margin: 52, share: 33 },
        { name: 'Cachaça', revenue: 2.0, volume: 300, avg: 6.7, margin: 48, share: 24 },
      ]},
      { name: 'Food', revenue: 5.2, volume: 1600, margin: 30, brands: [
        { name: 'Tapas', revenue: 2.4, volume: 720, avg: 3.3, margin: 32, share: 46 },
        { name: 'Empanadas', revenue: 1.6, volume: 500, avg: 3.2, margin: 28, share: 31 },
        { name: 'Guacamole', revenue: 1.2, volume: 380, avg: 3.2, margin: 30, share: 23 },
      ]},
      { name: 'Beer', revenue: 2.4, volume: 600, margin: 32, brands: [
        { name: 'Corona', revenue: 1.4, volume: 380, avg: 3.7, margin: 34, share: 58 },
        { name: 'Modelo', revenue: 1.0, volume: 220, avg: 4.5, margin: 30, share: 42 },
      ]},
      { name: 'Wine', revenue: 1.4, volume: 200, margin: 46, brands: [
        { name: 'Malbec', revenue: 0.8, volume: 120, avg: 6.7, margin: 48, share: 57 },
        { name: 'Tempranillo', revenue: 0.6, volume: 80, avg: 7.5, margin: 44, share: 43 },
      ]},
    ],
    behavior: { returning: 34, loyaltyAdoption: 38, vipShare: 10, peakHours: '10PM–1:30AM' },
    age: [{ range: '18–24', pct: 28 }, { range: '25–34', pct: 42 }, { range: '35–44', pct: 22 }, { range: '45+', pct: 8 }],
    gender: [{ name: 'Male', value: 45, color: '#3B82F6' }, { name: 'Female', value: 48, color: '#F59E0B' }, { name: 'Not specified', value: 7, color: '#F0F1F3' }],
    genderRet: { male: 30, female: 38 },
    insights: ['Highest retention (34%) and growth (+18%) across all genres', 'Female audience slightly larger and 26% higher retention than male', 'Margarita alone is 40% of cocktail revenue — diversify menu', 'Loyalty adoption at 38% — highest across genres, great base to build on'],
    actions: [{ title: 'Expand to weeknight Latin events', impact: '+$6.8K/mo', detail: 'Capitalize on 34% retention with more frequent programming' }, { title: 'Launch couples package', impact: '+$4.2K/mo', detail: 'Gender-balanced audience ideal for date night promotions' }, { title: 'Introduce premium tequila tasting', impact: '+$2.6K/mo', detail: 'Upsell from Patrón base to high-margin flights' }],
  },
  'rnb-soul': {
    name: 'R&B / Soul', revenue: 25000, guests: 1200, avgSpend: 20.5, retention: 26, events: 8, growth: 6,
    categories: [
      { name: 'Cocktails', revenue: 11.2, volume: 1600, margin: 46, brands: [
        { name: 'Old Fashioned', revenue: 4.2, volume: 520, avg: 8.1, margin: 50, share: 38 },
        { name: 'Whiskey Sour', revenue: 3.4, volume: 480, avg: 7.1, margin: 44, share: 30 },
        { name: 'Manhattan', revenue: 2.2, volume: 340, avg: 6.5, margin: 48, share: 20 },
        { name: 'Cosmopolitan', revenue: 1.4, volume: 260, avg: 5.4, margin: 42, share: 12 },
      ]},
      { name: 'Wine', revenue: 6.8, volume: 800, margin: 48, brands: [
        { name: 'Pinot Noir', revenue: 2.8, volume: 320, avg: 8.8, margin: 50, share: 41 },
        { name: 'Cabernet', revenue: 2.4, volume: 280, avg: 8.6, margin: 46, share: 35 },
        { name: 'Champagne', revenue: 1.6, volume: 200, avg: 8.0, margin: 48, share: 24 },
      ]},
      { name: 'Spirits', revenue: 4.2, volume: 480, margin: 52, brands: [
        { name: 'Hennessy', revenue: 2.0, volume: 220, avg: 9.1, margin: 54, share: 48 },
        { name: 'Rémy Martin', revenue: 1.4, volume: 140, avg: 10.0, margin: 50, share: 33 },
        { name: 'D\'Ussé', revenue: 0.8, volume: 120, avg: 6.7, margin: 48, share: 19 },
      ]},
      { name: 'Food', revenue: 2.0, volume: 600, margin: 28, brands: [
        { name: 'Cheese Board', revenue: 0.8, volume: 200, avg: 4.0, margin: 30, share: 40 },
        { name: 'Sliders', revenue: 0.7, volume: 220, avg: 3.2, margin: 26, share: 35 },
        { name: 'Dessert', revenue: 0.5, volume: 180, avg: 2.8, margin: 28, share: 25 },
      ]},
    ],
    behavior: { returning: 26, loyaltyAdoption: 24, vipShare: 14, peakHours: '9PM–12AM' },
    age: [{ range: '18–24', pct: 18 }, { range: '25–34', pct: 38 }, { range: '35–44', pct: 30 }, { range: '45+', pct: 14 }],
    gender: [{ name: 'Male', value: 42, color: '#3B82F6' }, { name: 'Female', value: 50, color: '#F59E0B' }, { name: 'Not specified', value: 8, color: '#F0F1F3' }],
    genderRet: { male: 22, female: 30 },
    insights: ['Highest avg spend ($20.5) — premium audience willing to pay', 'VIP share at 14% is second highest — bottle service opportunity', 'Old Fashioned dominates cocktails — signature drink potential', 'Older demo (35-44 at 30%) drives premium category sales'],
    actions: [{ title: 'Launch "Soul Night" VIP experience', impact: '+$4.8K/mo', detail: 'Premium audience already spending — create exclusive tier' }, { title: 'Wine & cocktail pairing menu', impact: '+$2.8K/mo', detail: 'Cross-sell high-margin categories' }, { title: 'Live R&B artist residency', impact: '+$3.2K/mo', detail: 'Drive retention from 26% to 35% with exclusive acts' }],
  },
  'pop-commercial': {
    name: 'Pop / Commercial', revenue: 29000, guests: 2400, avgSpend: 12, retention: 20, events: 10, growth: -2,
    categories: [
      { name: 'Beer', revenue: 10.8, volume: 4200, margin: 30, brands: [
        { name: 'Bud Light', revenue: 3.6, volume: 1600, avg: 2.3, margin: 32, share: 33 },
        { name: 'Corona', revenue: 3.2, volume: 1200, avg: 2.7, margin: 30, share: 30 },
        { name: 'Heineken', revenue: 2.4, volume: 800, avg: 3.0, margin: 28, share: 22 },
        { name: 'Stella', revenue: 1.6, volume: 600, avg: 2.7, margin: 30, share: 15 },
      ]},
      { name: 'Cocktails', revenue: 8.6, volume: 1400, margin: 40, brands: [
        { name: 'Vodka Cranberry', revenue: 3.2, volume: 520, avg: 6.2, margin: 42, share: 37 },
        { name: 'Rum & Coke', revenue: 2.8, volume: 480, avg: 5.8, margin: 38, share: 33 },
        { name: 'Tequila Sunrise', revenue: 2.6, volume: 400, avg: 6.5, margin: 40, share: 30 },
      ]},
      { name: 'Spirits', revenue: 4.8, volume: 600, margin: 48, brands: [
        { name: 'Smirnoff', revenue: 2.0, volume: 280, avg: 7.1, margin: 50, share: 42 },
        { name: 'Bacardi', revenue: 1.6, volume: 200, avg: 8.0, margin: 46, share: 33 },
        { name: 'Jose Cuervo', revenue: 1.2, volume: 120, avg: 10.0, margin: 48, share: 25 },
      ]},
      { name: 'Food', revenue: 3.4, volume: 1800, margin: 24, brands: [
        { name: 'Fries', revenue: 1.4, volume: 800, avg: 1.8, margin: 26, share: 41 },
        { name: 'Pizza Slices', revenue: 1.2, volume: 600, avg: 2.0, margin: 22, share: 35 },
        { name: 'Nachos', revenue: 0.8, volume: 400, avg: 2.0, margin: 24, share: 24 },
      ]},
      { name: 'Wine', revenue: 1.4, volume: 200, margin: 44, brands: [
        { name: 'Prosecco', revenue: 0.8, volume: 120, avg: 6.7, margin: 46, share: 57 },
        { name: 'House White', revenue: 0.6, volume: 80, avg: 7.5, margin: 42, share: 43 },
      ]},
    ],
    behavior: { returning: 20, loyaltyAdoption: 16, vipShare: 3, peakHours: '10PM–1AM' },
    age: [{ range: '18–24', pct: 52 }, { range: '25–34', pct: 30 }, { range: '35–44', pct: 12 }, { range: '45+', pct: 6 }],
    gender: [{ name: 'Male', value: 50, color: '#3B82F6' }, { name: 'Female', value: 42, color: '#F59E0B' }, { name: 'Not specified', value: 8, color: '#F0F1F3' }],
    genderRet: { male: 18, female: 22 },
    insights: ['Youngest audience (52% under 25) — price-sensitive segment', 'Beer dominates revenue — opportunity to upsell to cocktails', 'Retention at 20% with -2% growth — needs format refresh', 'High volume but low margin — focus on conversion to premium'],
    actions: [{ title: 'Student night with drink deals', impact: '+$3.2K/mo', detail: 'Convert 18-24 volume into recurring visits' }, { title: 'Introduce "upgrade" cocktail specials', impact: '+$2.6K/mo', detail: 'Move beer buyers into 40% margin cocktails' }, { title: 'Themed nights (90s, 2000s)', impact: '+$2.0K/mo', detail: 'Differentiate from competition to improve retention' }],
  },
};

/* ── Helpers ── */
function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function Card({ children, delay = 0, className = '', testId }) {
  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay }}
      className={`rounded-xl border border-border bg-[hsl(var(--card))] p-5 ${className}`}
      data-testid={testId}
    >{children}</motion.div>
  );
}

/* ── Component ── */
export default function AudienceGenreDetail() {
  const { genreSlug } = useParams();
  const navigate = useNavigate();
  const genre = G[genreSlug];

  const [metric, setMetric] = useState('Revenue');
  const [selectedCat, setSelectedCat] = useState(null);
  const [brandSort, setBrandSort] = useState('Revenue');

  const metricKey = { Revenue: 'revenue', Volume: 'volume', Margin: 'margin' };
  const catData = genre?.categories || [];
  const selectedCatData = selectedCat ? catData.find(c => c.name === selectedCat) : null;
  const brands = selectedCatData?.brands || [];
  const brandSortKey = metricKey[brandSort];

  const sortedBrands = useMemo(() =>
    [...brands].sort((a, b) => b[brandSortKey] - a[brandSortKey]),
    [brands, brandSortKey]
  );

  const allProducts = useMemo(() => {
    if (selectedCat && selectedCatData) return selectedCatData.brands;
    return catData.flatMap(c => c.brands).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [selectedCat, selectedCatData, catData]);

  if (!genre) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">Genre not found</p>
      <button onClick={() => navigate('/owner/customers/audience')} className="text-xs text-[hsl(var(--primary))] hover:underline">Back to Audience Intelligence</button>
    </div>
  );

  function fmtMetric(val) {
    if (metric === 'Revenue') return `$${val}K`;
    if (metric === 'Margin') return `${val}%`;
    return val.toLocaleString();
  }
  function fmtBrandMetric(val) {
    if (brandSort === 'Revenue') return `$${val}K`;
    if (brandSort === 'Margin') return `${val}%`;
    return val.toLocaleString();
  }

  const kpiIcons = [DollarSign, Users, ShoppingBag, Repeat, Music, TrendingUp];
  const kpis = [
    { label: 'Revenue', value: `$${(genre.revenue / 1000).toFixed(0)}K` },
    { label: 'Guests', value: genre.guests.toLocaleString() },
    { label: 'Avg Spend', value: `$${genre.avgSpend}` },
    { label: 'Retention', value: `${genre.retention}%` },
    { label: 'Events', value: genre.events },
    { label: 'Growth', value: `${genre.growth >= 0 ? '+' : ''}${genre.growth}%` },
  ];

  const toggles = ['Revenue', 'Volume', 'Margin'];

  return (
    <div className="flex flex-col gap-6" data-testid="genre-detail">

      {/* 2. Back */}
      <motion.button {...fadeUp} onClick={() => navigate('/owner/customers/audience')}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[hsl(var(--primary))] transition-colors self-start mb-[-8px]"
        data-testid="genre-back-btn"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Audience Intelligence
      </motion.button>

      {/* 3. KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpiIcons[i];
          return (
            <motion.div key={kpi.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.03 }}
              className="rounded-xl border border-border bg-[hsl(var(--card))] p-3.5"
              data-testid={`genre-kpi-${i}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                <Icon className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground tabular-nums">{kpi.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* 4. Consumption + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 4a. Consumption Breakdown */}
        <Card delay={0.1} className="lg:col-span-2" testId="consumption-chart">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
                <BarChart3 className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Consumption Breakdown</h3>
                <p className="text-xs text-muted-foreground">Click any category to drill down</p>
              </div>
            </div>
            <div className="flex gap-1">
              {toggles.map(t => (
                <button key={t} onClick={() => setMetric(t)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${metric === t ? 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]' : 'text-muted-foreground hover:text-foreground'}`}
                  data-testid={`consumption-toggle-${t.toLowerCase()}`}
                >{t}</button>
              ))}
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={catData}>
                <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }}
                  tickFormatter={(v) => fmtMetric(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }} width={70} />
                <Tooltip {...tooltipStyle} formatter={(v) => [fmtMetric(v), metric]} />
                <Bar dataKey={metricKey[metric]} radius={[0, 4, 4, 0]} cursor="pointer"
                  onClick={(data) => setSelectedCat(prev => prev === data.name ? null : data.name)}
                >
                  {catData.map((c) => (
                    <Cell key={c.name}
                      fill={selectedCat === c.name ? '#F59E0B' : selectedCat ? '#F0F1F3' : '#60A5FA'}
                      opacity={selectedCat && selectedCat !== c.name ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {selectedCat && (
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Showing brands for: <span className="font-semibold text-foreground">{selectedCat}</span></span>
              <button onClick={() => setSelectedCat(null)} className="text-[hsl(var(--primary))] hover:underline font-semibold">Clear</button>
            </div>
          )}
        </Card>

        {/* 4b. Categories */}
        <Card delay={0.12} testId="categories-list">
          <SectionHeader icon={ShoppingBag} title="Categories" subtitle="Click to view brands" />
          <div className="flex flex-col gap-2">
            {catData.map((c) => {
              const totalRev = catData.reduce((s, x) => s + x.revenue, 0);
              const pct = Math.round((c.revenue / totalRev) * 100);
              const isSelected = selectedCat === c.name;
              return (
                <div key={c.name}
                  onClick={() => setSelectedCat(prev => prev === c.name ? null : c.name)}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[hsl(var(--primary)_/_0.1)] border border-[hsl(var(--primary)_/_0.3)]' : 'bg-[hsl(var(--muted)_/_0.3)] border border-transparent hover:bg-[hsl(var(--muted)_/_0.5)]'}`}
                  data-testid={`category-${c.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{c.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground tabular-nums">{pct}%</span>
                      <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">${c.revenue}K rev &middot; {c.volume.toLocaleString()} units &middot; {c.margin}% margin</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 5. Brand Drill-down */}
      <AnimatePresence>
        {selectedCat && selectedCatData && (
          <motion.div
            key="brand-drilldown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-border bg-[hsl(var(--card))] p-5 overflow-hidden"
            data-testid="brand-drilldown"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary)_/_0.1)] flex items-center justify-center">
                  <Package className="h-[18px] w-[18px] text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{selectedCat} — Brand Breakdown</h3>
                  <p className="text-xs text-muted-foreground">{sortedBrands.length} brands tracked</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                <div className="flex gap-1">
                  {toggles.map(t => (
                    <button key={t} onClick={() => setBrandSort(t)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${brandSort === t ? 'bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]' : 'text-muted-foreground hover:text-foreground'}`}
                    >{t}</button>
                  ))}
                </div>
                <button onClick={() => setSelectedCat(null)} className="ml-2 h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Brand Chart */}
            <div style={{ height: Math.max(140, sortedBrands.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={sortedBrands}>
                  <CartesianGrid stroke="#EAECEF" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }}
                    tickFormatter={(v) => fmtBrandMetric(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAECEF' }} width={120} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [fmtBrandMetric(v), brandSort]} />
                  <Bar dataKey={brandSortKey} fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Brand Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
              {sortedBrands.map((b, i) => (
                <div key={b.name} className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]" data-testid={`brand-card-${i}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <span className="text-sm font-semibold text-foreground truncate">{b.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">${b.revenue}K &middot; {b.volume} units &middot; ${b.avg} avg &middot; {b.margin}% margin</p>
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full bg-[hsl(var(--muted)_/_0.5)] overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500/50" style={{ width: `${b.share}%` }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{b.share}% of category</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Audience Behavior + Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6a. Behavior */}
        <Card delay={0.18} testId="audience-behavior">
          <SectionHeader icon={Users} title="Audience Behavior" subtitle="Engagement metrics" />
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Returning %', value: `${genre.behavior.returning}%`, sub: 'come back' },
              { label: 'Loyalty Adoption', value: `${genre.behavior.loyaltyAdoption}%`, sub: 'enrolled' },
              { label: 'VIP Share', value: `${genre.behavior.vipShare}%`, sub: 'of audience' },
              { label: 'Peak Hours', value: genre.behavior.peakHours, sub: 'highest traffic' },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="text-base font-bold text-foreground tabular-nums">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.sub}</p>
              </div>
            ))}
          </div>
          {/* Age Distribution */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Age Distribution</p>
          <div className="flex flex-col gap-2">
            {genre.age.map(a => (
              <div key={a.range} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">{a.range}</span>
                <div className="flex-1 h-5 rounded bg-[hsl(var(--muted)_/_0.4)] relative overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${a.pct}%` }} transition={{ duration: 0.5, delay: 0.3 }}
                    className="h-full rounded bg-blue-500/40" />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-foreground">{a.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 6b. Composition */}
        <Card delay={0.2} testId="audience-composition">
          <SectionHeader icon={Heart} title="Audience Composition" subtitle="Demographics & retention" />
          <div className="flex items-center gap-6 mb-4">
            <div className="w-[40%]">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={genre.gender} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={55} innerRadius={28} paddingAngle={4} strokeWidth={0}>
                    {genre.gender.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              {genre.gender.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-sm font-medium text-foreground">{d.name}</span>
                  <span className="text-xs font-bold text-foreground tabular-nums">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Retention split bar */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Retention by Gender</p>
          <div className="flex h-6 rounded-md overflow-hidden">
            <div className="bg-blue-500/50 flex items-center justify-center text-[10px] font-bold text-foreground" style={{ width: `${genre.genderRet.male}%` }}>
              M {genre.genderRet.male}%
            </div>
            <div className="bg-[hsl(var(--muted)_/_0.6)] flex items-center justify-center text-[10px] font-bold text-foreground" style={{ width: `${100 - genre.genderRet.male}%` }}>
              F {genre.genderRet.female}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic mt-3">Demographics are shown only for explicitly collected data</p>
        </Card>
      </div>

      {/* 7. Top Products */}
      <Card delay={0.24} testId="top-products">
        <SectionHeader icon={ShoppingBag}
          title={selectedCat ? `Top ${selectedCat} Products` : 'Top Products'}
          subtitle={selectedCat ? `Best sellers in ${selectedCat}` : 'Best sellers across all categories'} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {allProducts.slice(0, 8).map((p, i) => (
            <div key={p.name} className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]" data-testid={`product-${i}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">${p.revenue}K &middot; {p.volume} units &middot; ${p.avg} avg &middot; {p.margin}% margin</p>
              <div className="mt-2">
                <div className="h-1.5 rounded-full bg-[hsl(var(--muted)_/_0.5)] overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500/50" style={{ width: `${p.share}%` }} />
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">{p.share}% of category</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. Insights + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 8a. Smart Insights */}
        <Card delay={0.28} testId="genre-insights">
          <SectionHeader icon={Sparkles} title="Smart Insights" subtitle="AI-powered observations" />
          <div className="flex flex-col gap-2">
            {genre.insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)]" data-testid={`genre-insight-${i}`}>
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))] shrink-0 mt-1.5" />
                <span className="text-sm text-foreground">{ins}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 8b. Recommended Actions */}
        <Card delay={0.32} testId="genre-actions">
          <SectionHeader icon={Target} title="Recommended Actions" subtitle="Based on genre data" />
          <div className="flex flex-col gap-2">
            {genre.actions.map((a, i) => (
              <div key={i} className="p-3 rounded-lg bg-[hsl(var(--muted)_/_0.3)] hover:bg-[hsl(var(--muted)_/_0.5)] cursor-pointer transition-colors" data-testid={`genre-action-${i}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{a.title}</span>
                  <span className="text-[10px] font-bold text-[hsl(var(--success))] tabular-nums shrink-0">{a.impact}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
