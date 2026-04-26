<?php
/**
 * Plugin Name: 自分株式会社 デザイン＆アフィリエイト最適化
 * Description: プロ仕様デザイン・アフィリエイト導線・固定CTAバナーを自動適用します。有効化するだけで完了。
 * Version: 1.0.0
 * Author: 自分株式会社
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/* ─── 1. カスタムCSS をフロントに挿入 ─────────────────── */
add_action( 'wp_enqueue_scripts', function() {
    wp_register_style( 'jibun-os-base', false );
    wp_enqueue_style( 'jibun-os-base' );
    wp_add_inline_style( 'jibun-os-base', jibun_os_custom_css() );
} );

/* ─── 2. Google Fonts + スティッキーCTA をフロントに挿入 ─ */
add_action( 'wp_head', function() { ?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
<?php } );

add_action( 'wp_footer', function() { ?>
<style>
.jibun-sticky-cta{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#0f172a,#1e1b4b);border-top:1px solid rgba(124,58,237,.5);padding:10px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 -4px 30px rgba(0,0,0,.4);transition:transform .3s}
.jibun-sticky-cta.jibun-hidden{transform:translateY(100%)}
.jibun-sticky-cta .jct{flex:1;min-width:0}
.jibun-sticky-cta .jct strong{display:block;color:#fff;font-size:.9rem;font-weight:800}
.jibun-sticky-cta .jct span{color:#94a3b8;font-size:.75rem}
.jibun-sticky-cta .jcb{flex-shrink:0;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff!important;text-decoration:none!important;border-radius:8px;padding:10px 20px;font-size:.85rem;font-weight:800;box-shadow:0 4px 15px rgba(245,158,11,.5);transition:transform .15s,box-shadow .15s;white-space:nowrap}
.jibun-sticky-cta .jcb:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(245,158,11,.6)}
.jibun-sticky-cta .jcx{color:#475569;background:none;border:none;cursor:pointer;font-size:1.2rem;padding:4px;flex-shrink:0;line-height:1}
@media(max-width:600px){.jibun-sticky-cta{flex-direction:column;padding:12px 16px;gap:8px;text-align:center}.jibun-sticky-cta .jcb{width:100%;text-align:center}.jibun-sticky-cta .jcx{position:absolute;top:8px;right:12px}}
</style>
<div class="jibun-sticky-cta" id="jibunCta">
  <div class="jct">
    <strong>🎁 無料PDF「AIで月3万円稼ぐロードマップ」配布中</strong>
    <span>Hermes Agent × n8n × アフィリエイトの組み合わせを完全解説</span>
  </div>
  <a href="/free-gift" class="jcb">今すぐ無料で受け取る →</a>
  <button class="jcx" onclick="document.getElementById('jibunCta').classList.add('jibun-hidden');localStorage.setItem('jibunCtaClosed','1')">✕</button>
</div>
<script>
(function(){if(localStorage.getItem('jibunCtaClosed')==='1'){var e=document.getElementById('jibunCta');if(e)e.classList.add('jibun-hidden');}})();
</script>
<?php } );

/* ─── 3. OGP / SEO メタタグ ──────────────────────────── */
add_action( 'wp_head', function() {
    global $post;
    $site_name = get_bloginfo('name');
    $desc = is_singular() && $post
        ? mb_strimwidth( strip_tags( get_the_excerpt($post) ), 0, 120, '…' )
        : 'AIと自動化ツールを活用して副業収益を最大化。Hermes Agent・n8n・アフィリエイトの組み合わせで月収3万円達成への道。';
    $title = is_singular() && $post ? get_the_title($post) . ' | ' . $site_name : $site_name;
    $url   = is_singular() && $post ? get_permalink($post) : home_url('/');
    $img   = ( is_singular() && $post && has_post_thumbnail($post) )
        ? get_the_post_thumbnail_url($post, 'large')
        : plugins_url( 'ogp.png', __FILE__ );
    ?>
<meta property="og:type" content="<?php echo is_singular() ? 'article' : 'website'; ?>">
<meta property="og:title" content="<?php echo esc_attr($title); ?>">
<meta property="og:description" content="<?php echo esc_attr($desc); ?>">
<meta property="og:url" content="<?php echo esc_url($url); ?>">
<meta property="og:site_name" content="<?php echo esc_attr($site_name); ?>">
<meta property="og:image" content="<?php echo esc_url($img); ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?php echo esc_attr($title); ?>">
<meta name="twitter:description" content="<?php echo esc_attr($desc); ?>">
<meta name="twitter:image" content="<?php echo esc_url($img); ?>">
<?php }, 5 );

/* ─── 4. 管理画面：設定ページ ────────────────────────── */
add_action( 'admin_menu', function() {
    add_options_page( '自分OS設定', '🚀 自分OS設定', 'manage_options', 'jibun-os', 'jibun_os_settings_page' );
} );

function jibun_os_settings_page() { ?>
<div class="wrap">
<h1>🚀 自分株式会社 デザイン設定</h1>
<div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:24px;max-width:680px;">
<h2 style="color:#7c3aed;margin-top:0;">✅ プラグインが有効です</h2>
<p>以下が自動的に適用されています：</p>
<ul>
  <li>✅ プロ仕様カスタムCSS（ヘッダー・カード・サイドバー・フッター）</li>
  <li>✅ Google Fonts（Noto Sans JP）</li>
  <li>✅ 画面下部固定CTAバナー（×で非表示・localStorage制御）</li>
  <li>✅ OGP / Twitterカードメタタグ</li>
</ul>
<hr>
<h3>📋 次にやること</h3>
<ol>
  <li><strong>サイドバーウィジェット設定</strong>: 外観 → ウィジェット → 「カスタムHTML」を追加して <code>affiliate-widget.html</code> の内容を貼り付け</li>
  <li><strong>カテゴリ作成</strong>: 投稿 → カテゴリー → 「AI・自動化」「副業・収益化」「ツールレビュー」を追加</li>
  <li><strong>アフィリエイト登録</strong>: A8.net / もしもアフィリエイト / Xサーバーアフィリエイト</li>
  <li><strong>無料プレゼント固定ページ</strong>: 「/free-gift」スラッグで固定ページを作成</li>
</ol>
</div>
</div>
<?php }

/* ─── 5. カスタムCSS 本体 ─────────────────────────────── */
function jibun_os_custom_css() { return '
:root{--brand-primary:#7c3aed;--brand-secondary:#4f46e5;--brand-accent:#10b981;--brand-gold:#f59e0b;--brand-dark:#0f172a;--brand-surface:#1e293b;--brand-muted:#94a3b8;--radius:12px}
body{font-family:"Noto Sans JP",-apple-system,BlinkMacSystemFont,sans-serif;background:#f8fafc;color:#1e293b}
#header,.site-header{background:linear-gradient(135deg,#0f172a,#1e293b)!important;border-bottom:1px solid rgba(124,58,237,.3)!important;box-shadow:0 4px 24px rgba(0,0,0,.3)!important}
.site-name-text,#site-name a,.logo-text{color:#fff!important;font-weight:800!important;font-size:1.4rem!important}
.tagline,.site-description{color:#94a3b8!important;font-size:.75rem!important}
#nav,.navi-in,.global-nav,nav.navi{background:rgba(15,23,42,.95)!important;border-top:1px solid rgba(124,58,237,.2)!important}
.navi-in>ul>li>a,.global-nav a{color:#cbd5e1!important;font-size:.85rem!important;font-weight:500;padding:12px 16px!important;transition:color .2s,background .2s!important}
.navi-in>ul>li>a:hover,.global-nav a:hover{color:#fff!important;background:rgba(124,58,237,.2)!important}
.card,.post-list .post,article.post,.entry-card{background:#fff!important;border:1px solid #e2e8f0!important;border-radius:var(--radius)!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;transition:transform .2s,box-shadow .2s!important;overflow:hidden}
.card:hover,.post-list .post:hover,article.post:hover,.entry-card:hover{transform:translateY(-4px)!important;box-shadow:0 12px 32px rgba(0,0,0,.12)!important}
.entry-title a,.post-title a{color:#1e293b!important;font-weight:700!important;text-decoration:none!important;transition:color .2s!important}
.entry-title a:hover,.post-title a:hover{color:var(--brand-primary)!important}
.cat-label,.category-label{background:var(--brand-primary)!important;color:#fff!important;font-size:.7rem!important;padding:2px 8px!important;border-radius:4px!important;font-weight:700!important}
.widget,.sidebar .widget{background:#fff!important;border:1px solid #e2e8f0!important;border-radius:var(--radius)!important;padding:20px!important;margin-bottom:20px!important;box-shadow:0 2px 8px rgba(0,0,0,.05)!important}
.widget-title,.widgettitle{font-size:.82rem!important;font-weight:800!important;text-transform:uppercase!important;letter-spacing:.08em!important;color:#94a3b8!important;margin-bottom:12px!important;padding-bottom:8px!important;border-bottom:2px solid #e2e8f0!important}
.author-box,.author-card,.profile-box{background:linear-gradient(135deg,#0f172a,#1e293b)!important;color:#fff!important;border-radius:var(--radius)!important;border:1px solid rgba(124,58,237,.3)!important;padding:24px!important}
.author-box .author-name,.author-card .author-name{color:#fff!important;font-weight:800!important}
#footer,.site-footer{background:#0f172a!important;color:#94a3b8!important;border-top:1px solid rgba(124,58,237,.2)!important;padding:40px 24px 80px!important}
.footer-copyright{color:#475569!important;font-size:.78rem!important}
.wp-block-button__link{background:linear-gradient(135deg,#7c3aed,#4f46e5)!important;color:#fff!important;border-radius:8px!important;font-weight:700!important;box-shadow:0 4px 15px rgba(124,58,237,.4)!important;transition:transform .15s,box-shadow .15s!important;border:none!important}
.wp-block-button__link:hover{transform:translateY(-2px)!important;box-shadow:0 8px 25px rgba(124,58,237,.5)!important;color:#fff!important}
@media(max-width:768px){#footer,.site-footer{padding-bottom:100px!important}}
'; }
